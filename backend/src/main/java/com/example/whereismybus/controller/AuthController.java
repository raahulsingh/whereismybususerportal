package com.example.whereismybus.controller;

import com.example.whereismybus.entity.User;
import com.example.whereismybus.repository.UserRepository;
import com.example.whereismybus.service.EmailService;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String phone = body.get("phone");
            String password = body.get("password");
            Integer age = body.containsKey("age") && !body.get("age").isEmpty() ? Integer.parseInt(body.get("age")) : null;

            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }

            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPhone(phone);
            user.setAge(age);
            user.setPasswordHash(BCrypt.hashpw(password, BCrypt.gensalt()));

            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "User registered successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Registration failed"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (BCrypt.checkpw(password, user.getPasswordHash())) {
                String token = UUID.randomUUID().toString();
                user.setSessionToken(token);
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
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            // In production, send proper frontend URL
            String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
            
            try {
                emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
            } catch (Exception e) {
                // If SMTP is not set up correctly, fail gracefully.
                System.out.println("SMTP Error: " + e.getMessage());
                return ResponseEntity.badRequest().body(Map.of("error", "Could not send email. Please verify SMTP settings in application.properties"));
            }

            return ResponseEntity.ok(Map.of("message", "Reset link sent to email"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("password");

        Optional<User> userOpt = userRepository.findByResetToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getResetTokenExpiry().isAfter(LocalDateTime.now())) {
                user.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password reset successful"));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "Reset token expired"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid token"));
    }
}
