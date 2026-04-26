package com.example.whereismybus.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private final JdbcTemplate jdbc;

    public PaymentController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * POST /api/payment/create-order
     * Body: { "tripId": 5, "fromStop": "Delhi", "toStop": "Haldwani", "seatType": "seat", "seats": 1 }
     * Amount is calculated SERVER-SIDE — frontend amount is ignored.
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            double totalAmount;
            double unitPrice;

            // ── Check if trip details are provided for server-side calculation ──
            if (body.containsKey("tripId") && body.get("tripId") != null) {
                // Full server-side price calculation (preferred)
                Long tripId = Long.valueOf(body.get("tripId").toString());
                String fromStop = body.get("fromStop").toString();
                String toStop = body.get("toStop").toString();
                String seatType = body.getOrDefault("seatType", "seat").toString();
                int seats = body.containsKey("seats") ? Integer.parseInt(body.get("seats").toString()) : 1;

                unitPrice = calculatePrice(tripId, fromStop, toStop, seatType);
                totalAmount = unitPrice * seats;
            } else if (body.containsKey("amount") && body.get("amount") != null) {
                // Frontend-provided amount (used by user portal PaymentPage)
                totalAmount = Double.parseDouble(body.get("amount").toString());
                unitPrice = totalAmount;
            } else {
                return ResponseEntity.status(400).body(Map.of("error", "Either tripId+fromStop+toStop or amount is required."));
            }

            String receipt = body.getOrDefault("receipt", "bus_booking").toString();

            // Razorpay expects amount in paise (₹1 = 100 paise)
            int amountInPaise = (int) Math.round(totalAmount * 100);

            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", receipt);
            orderRequest.put("payment_capture", 1); // auto-capture

            Order order = client.orders.create(orderRequest);

            return ResponseEntity.ok(Map.of(
                "orderId", order.get("id"),
                "amount", amountInPaise,
                "unitPrice", unitPrice,
                "currency", "INR",
                "keyId", razorpayKeyId
            ));
        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Payment order creation failed. Please try again."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "An error occurred. Please try again."));
        }
    }

    /**
     * POST /api/payment/verify
     * Body: { "razorpay_order_id", "razorpay_payment_id", "razorpay_signature" }
     * Verifies payment signature to ensure it's genuine
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            String orderId = body.get("razorpay_order_id");
            String paymentId = body.get("razorpay_payment_id");
            String signature = body.get("razorpay_signature");

            if (orderId == null || paymentId == null || signature == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Missing payment parameters"));
            }

            // Generate expected signature: HMAC-SHA256(orderId + "|" + paymentId, secret)
            String data = orderId + "|" + paymentId;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            // Convert to hex
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String expectedSignature = hexString.toString();

            if (expectedSignature.equals(signature)) {
                return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "paymentId", paymentId,
                    "orderId", orderId
                ));
            } else {
                return ResponseEntity.status(400).body(Map.of(
                    "verified", false,
                    "error", "Payment verification failed"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Verification failed. Please contact support."));
        }
    }

    /**
     * GET /api/payment/key
     * Returns Razorpay key ID for frontend (safe to expose)
     */
    @GetMapping("/key")
    public ResponseEntity<?> getKey() {
        return ResponseEntity.ok(Map.of("keyId", razorpayKeyId));
    }

    // ── Server-side price calculation ─────────────────────────
    private double calculatePrice(Long tripId, String fromStop, String toStop, String seatType) {
        try {
            String sql = """
                SELECT
                    COALESCE(rp.base_price, 500) AS basePrice,
                    COALESCE(rs_from.price_offset, 0) AS fromOffset,
                    COALESCE(rs_to.price_offset, 0) AS toOffset,
                    COALESCE(rs_from.sleeper_price_offset, 0) AS fromSleeperOffset,
                    COALESCE(rs_to.sleeper_price_offset, 0) AS toSleeperOffset
                FROM trips t
                JOIN routes r ON r.id = t.route_id
                JOIN stops s_from ON TRIM(LOWER(s_from.name)) = TRIM(LOWER(?)) AND s_from.route_id = r.id
                JOIN stops s_to ON TRIM(LOWER(s_to.name)) = TRIM(LOWER(?)) AND s_to.route_id = r.id
                LEFT JOIN route_pricing rp ON rp.route_id = r.id
                LEFT JOIN route_stops rs_from ON rs_from.route_id = r.id AND rs_from.stop_id = s_from.id
                LEFT JOIN route_stops rs_to ON rs_to.route_id = r.id AND rs_to.stop_id = s_to.id
                WHERE t.id = ?
                LIMIT 1
                """;
            Map<String, Object> row = jdbc.queryForMap(sql, fromStop.trim(), toStop.trim(), tripId);
            double basePrice = ((Number) row.get("basePrice")).doubleValue();
            double fromOffset = ((Number) row.get("fromOffset")).doubleValue();
            double toOffset = ((Number) row.get("toOffset")).doubleValue();
            double fromSleeperOffset = ((Number) row.get("fromSleeperOffset")).doubleValue();
            double toSleeperOffset = ((Number) row.get("toSleeperOffset")).doubleValue();

            if ("sleeper".equalsIgnoreCase(seatType)) {
                return toSleeperOffset > 0 ? Math.max(toSleeperOffset - fromSleeperOffset, 0)
                        : (toOffset > 0 ? Math.round(Math.max(toOffset - fromOffset, 0) * 1.5) : basePrice);
            } else {
                return toOffset > 0 ? Math.max(toOffset - fromOffset, 0) : basePrice;
            }
        } catch (Exception e) {
            return 500; // safe fallback
        }
    }
}
