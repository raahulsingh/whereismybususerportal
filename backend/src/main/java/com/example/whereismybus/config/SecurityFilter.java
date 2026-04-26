package com.example.whereismybus.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Unified security filter that handles:
 * 1. Admin endpoint authentication (X-Admin-Token header)
 * 2. Driver API key authentication (X-API-KEY header)
 * 3. Rate limiting on auth endpoints (including agent login)
 * 4. Security headers on all responses
 * Note: Agent auth (/api/agent/*) is handled in AgentController via DB token lookup.
 */
@Component
public class SecurityFilter extends OncePerRequestFilter {

    @Value("${app.apiKey}")
    private String driverApiKey;

    @Value("${app.admin.token.secret}")
    private String adminTokenSecret;

    // ── Rate Limiting ─────────────────────────────────────────
    // Simple in-memory rate limiter: IP → (count, windowStart)
    private final Map<String, RateBucket> rateBuckets = new ConcurrentHashMap<>();
    private static final int RATE_LIMIT_AUTH = 10;       // max requests per window
    private static final long RATE_WINDOW_MS = 60_000;   // 1 minute window

    private static class RateBucket {
        final AtomicInteger count;
        final long windowStart;
        RateBucket(AtomicInteger count, long windowStart) {
            this.count = count;
            this.windowStart = windowStart;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // ── 1. Add security headers to ALL responses ──────────
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "geolocation=(self)");

        // ── 2. Allow preflight OPTIONS through ────────────────
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // ── 3. Rate limit auth endpoints ──────────────────────
        if (uri.startsWith("/api/auth/login") ||
            uri.startsWith("/api/auth/register") ||
            uri.startsWith("/api/auth/forgot-password") ||
            uri.startsWith("/api/admin/login") ||
            uri.startsWith("/api/booking/admin/login") ||
            uri.startsWith("/api/agent/login")) {

            String clientIp = getClientIp(request);
            if (isRateLimited(clientIp)) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        // ── 4. Protect /api/driver/* with API key ─────────────
        if (uri.startsWith("/api/driver/")) {
            String key = request.getHeader("X-API-KEY");
            if (key == null || !key.equals(driverApiKey)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Invalid API key\"}");
                return;
            }
        }

        // ── 5. Protect /api/admin/* with admin token ──────────
        //    (except login endpoints — those generate the token)
        if ((uri.startsWith("/api/admin/") && !uri.equals("/api/admin/login") && !uri.startsWith("/api/admin/health/") && !uri.endsWith("/assignments")) ||
            (uri.startsWith("/api/booking/admin/") && !uri.equals("/api/booking/admin/login"))) {

            String adminToken = request.getHeader("X-Admin-Token");
            if (adminToken == null || !verifyAdminToken(adminToken)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Unauthorized. Valid admin token required.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    // ── Admin Token Signing & Verification ────────────────────

    /**
     * Generates a signed admin token: "admin:{timestamp}:{hmac}"
     * Token is valid for 24 hours.
     */
    public String generateAdminToken(String role) {
        long timestamp = System.currentTimeMillis();
        String payload = role + ":" + timestamp;
        String signature = hmacSha256(payload);
        return payload + ":" + signature;
    }

    /**
     * Verifies admin token signature and checks expiry (24 hours).
     */
    private boolean verifyAdminToken(String token) {
        try {
            String[] parts = token.split(":");
            if (parts.length != 3) return false;

            String role = parts[0];
            long timestamp = Long.parseLong(parts[1]);
            String signature = parts[2];

            // Check expiry — 24 hours
            if (System.currentTimeMillis() - timestamp > 24 * 3600 * 1000L) return false;

            // Verify HMAC
            String payload = role + ":" + timestamp;
            String expectedSignature = hmacSha256(payload);
            return expectedSignature.equals(signature);

        } catch (Exception e) {
            return false;
        }
    }

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(adminTokenSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }

    // ── Rate Limiting Logic ───────────────────────────────────

    private boolean isRateLimited(String clientIp) {
        long now = System.currentTimeMillis();
        rateBuckets.compute(clientIp, (key, bucket) -> {
            if (bucket == null || now - bucket.windowStart > RATE_WINDOW_MS) {
                return new RateBucket(new AtomicInteger(1), now);
            }
            bucket.count.incrementAndGet();
            return bucket;
        });
        RateBucket bucket = rateBuckets.get(clientIp);
        return bucket != null && bucket.count.get() > RATE_LIMIT_AUTH;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
