package com.example.whereismybus.controller;

import com.example.whereismybus.entity.User;
import com.example.whereismybus.repository.UserRepository;
import com.example.whereismybus.service.EmailService;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.example.whereismybus.service.OtpService otpService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    // ── Validation patterns ──────────────────────────────────
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{10,15}$");
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;
    private static final int SESSION_EXPIRY_HOURS = 24;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String phone = body.get("phone");
            String password = body.get("password");
            Integer age = body.containsKey("age") && body.get("age") != null && !body.get("age").isEmpty()
                    ? Integer.parseInt(body.get("age")) : null;

            // ── Input validation ──────────────────────────────
            if (name == null || name.trim().isEmpty() || name.length() > 100) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required (max 100 characters)"));
            }
            if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Valid email is required"));
            }
            if (phone == null || !PHONE_PATTERN.matcher(phone).matches()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Valid phone number is required (10-15 digits)"));
            }

            // ── Password strength check ──────────────────────
            String pwError = validatePassword(password);
            if (pwError != null) {
                return ResponseEntity.badRequest().body(Map.of("error", pwError));
            }

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }

            User user = new User();
            user.setName(name.trim());
            user.setEmail(email.trim().toLowerCase());
            user.setPhone(phone.trim());
            user.setAge(age);
            user.setPasswordHash(BCrypt.hashpw(password, BCrypt.gensalt(12)));

            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed. Please try again."));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // ── Account lockout check ─────────────────────────
            if (user.isAccountLocked()) {
                return ResponseEntity.status(401).body(Map.of("error",
                        "Account is temporarily locked due to too many failed attempts. Try again later."));
            }

            if (BCrypt.checkpw(password, user.getPasswordHash())) {
                // ── Successful login — reset lockout counter ──
                user.setFailedLoginAttempts(0);
                user.setAccountLockedUntil(null);

                // ── Generate session token with expiry ────────
                String token = UUID.randomUUID().toString();
                user.setSessionToken(token);
                user.setSessionTokenExpiry(LocalDateTime.now().plusHours(SESSION_EXPIRY_HOURS));
                userRepository.save(user);

                Map<String, Object> res = new HashMap<>();
                res.put("token", token);
                res.put("user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "phone", user.getPhone(),
                        "age", user.getAge() != null ? user.getAge() : ""
                ));
                return ResponseEntity.ok(res);
            } else {
                // ── Failed login — increment counter ──────────
                int attempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(attempts);
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
                }
                userRepository.save(user);
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Optional<User> userOpt = userRepository.findBySessionToken(token);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setSessionToken(null);
                user.setSessionTokenExpiry(null);
                userRepository.save(user);
            }
        }
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Optional<User> userOpt = userRepository.findBySessionToken(token);
            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // ── Check session expiry ──────────────────────
                if (user.isSessionExpired()) {
                    user.setSessionToken(null);
                    user.setSessionTokenExpiry(null);
                    userRepository.save(user);
                    return ResponseEntity.status(401).body(Map.of("error", "Session expired. Please login again."));
                }

                return ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "phone", user.getPhone(),
                        "age", user.getAge() != null ? user.getAge() : ""
                ));
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            otpService.generateAndSend("pwreset:" + user.getEmail(), user.getEmail(),
                "Password Reset OTP - Where is my Bus",
                "Your OTP for resetting your password is: ");
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<?> verifyResetOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }
        // Verify but don't delete yet, so reset-password can verify it again
        // Or we can return a temporary token. 
        // For simplicity, let's just check if it matches.
        if (otpService.verify("pwreset:" + email.trim().toLowerCase(), otp, false)) {
            return ResponseEntity.ok(Map.of("message", "OTP verified"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("password");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, OTP and new password are required"));
        }

        String pwError = validatePassword(newPassword);
        if (pwError != null) return ResponseEntity.badRequest().body(Map.of("error", pwError));

        if (otpService.verify("pwreset:" + email.trim().toLowerCase(), otp)) {
            Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt(12)));
                user.setSessionToken(null);
                user.setSessionTokenExpiry(null);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password reset successful"));
            }
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
    }

    // ── Password Strength Validation ──────────────────────────
    private String validatePassword(String password) {
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
            return "Password must be at least " + PASSWORD_MIN_LENGTH + " characters";
        }
        if (!password.matches(".*[A-Z].*")) {
            return "Password must contain at least one uppercase letter";
        }
        if (!password.matches(".*[0-9].*")) {
            return "Password must contain at least one digit";
        }
        return null; // valid
    }
}
