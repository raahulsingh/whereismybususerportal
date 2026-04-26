package com.example.whereismybus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP service using email delivery.
 * OTPs expire after 5 minutes.
 */
@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;

    // key → OtpEntry (otp value + expiry)
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private record OtpEntry(String otp, LocalDateTime expiry) {}

    /**
     * Generate a 6-digit OTP for the given key and send it via email.
     * @param key unique identifier (e.g., "cash:bookingRef" or "cancel:bookingRef")
     * @param email recipient email address
     * @param subject email subject
     * @param message email body template (OTP will be appended)
     * @return the generated OTP (for testing/logging only)
     */
    public String generateAndSend(String key, String email, String subject, String message) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", RANDOM.nextInt(999999));

        // Store with expiry
        otpStore.put(key, new OtpEntry(otp, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));

        // Send via email
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(email);
            mail.setSubject(subject);
            mail.setText(message + "\n\nYour OTP: " + otp + "\n\nThis OTP expires in " + OTP_EXPIRY_MINUTES + " minutes.\n\nRegards,\nWhere is my Bus Team");
            mailSender.send(mail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email to " + email + ": " + e.getMessage());
        }

        return otp;
    }

    /**
     * Send a generic email without OTP.
     * @param to recipient email address
     * @param subject email subject
     * @param text email body
     */
    public void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            mail.setSubject(subject);
            mail.setText(text);
            mailSender.send(mail);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    /**
     * Send a formatted ticket email.
     */
    public void sendTicketEmail(String email, String name, String ref, String from, String to, String date, String depTime, String busInfo, String seatNo, double amount) {
        if (email == null || email.isBlank()) return;
        String subject = "Bus Ticket Confirmed - " + ref;
        String text = String.format("""
            Dear %s,
            
            Your bus ticket has been confirmed!
            
            Ticket Details:
            ---------------------------
            Booking Ref : %s
            Route       : %s to %s
            Travel Date : %s
            Dep. Time   : %s
            Bus         : %s
            Seat No     : %s
            Amount Paid : Rs. %.2f
            ---------------------------
            
            Thank you for choosing Where is my Bus. Have a safe journey!
            """, name, ref, from, to, date, depTime, busInfo, seatNo, amount);
        sendEmail(email, subject, text);
    }

    /**
     * Verify OTP for the given key.
     * Deletes the OTP on successful verification (one-time use).
     */
    public boolean verify(String key, String otp) {
        return verify(key, otp, true);
    }

    public boolean verify(String key, String otp, boolean deleteOnSuccess) {
        OtpEntry entry = otpStore.get(key);
        if (entry == null) return false;
        if (entry.expiry().isBefore(LocalDateTime.now())) {
            otpStore.remove(key);
            return false; // expired
        }
        if (entry.otp().equals(otp)) {
            if (deleteOnSuccess) otpStore.remove(key);
            return true;
        }
        return false;
    }

    /**
     * Clean up expired OTPs (call periodically if needed).
     */
    public void cleanExpired() {
        LocalDateTime now = LocalDateTime.now();
        otpStore.entrySet().removeIf(e -> e.getValue().expiry().isBefore(now));
    }

    /**
     * Send a formatted cancellation email.
     */
    public void sendCancellationEmail(String email, String name, String ref, String from, String to, String date, String depTime, String busInfo) {
        if (email == null || email.isBlank()) return;
        String subject = "Booking Cancelled - " + ref;
        String text = String.format("""
            Dear %s,
            
            Your booking with reference %s has been cancelled.
            
            Details of Cancelled Trip:
            ---------------------------
            Booking Ref : %s
            Route       : %s to %s
            Travel Date : %s
            Dep. Time   : %s
            Bus         : %s
            Status      : CANCELLED
            ---------------------------
            
            If you did not request this cancellation, please contact our support immediately.
            
            Thank you for choosing Where is my Bus.
            """, name, ref, ref, from, to, date, depTime, busInfo);
        sendEmail(email, subject, text);
    }
}
