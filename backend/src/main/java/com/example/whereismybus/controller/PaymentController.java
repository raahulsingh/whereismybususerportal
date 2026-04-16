package com.example.whereismybus.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Map;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    /**
     * POST /api/payment/create-order
     * Body: { "amount": 683.55, "seats": 1, "receipt": "booking_ara_mango" }
     * Creates a Razorpay order and returns order ID + key to frontend
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            double amount = Double.parseDouble(body.get("amount").toString());
            String receipt = body.getOrDefault("receipt", "bus_booking").toString();

            // Razorpay expects amount in paise (₹1 = 100 paise)
            int amountInPaise = (int) Math.round(amount * 100);

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
                "currency", "INR",
                "keyId", razorpayKeyId
            ));
        } catch (RazorpayException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Razorpay order creation failed: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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

            // Generate expected signature: HMAC-SHA256(orderId + "|" + paymentId, secret)
            String data = orderId + "|" + paymentId;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes());

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
                    "error", "Payment signature verification failed"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Verification failed: " + e.getMessage()));
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
}
