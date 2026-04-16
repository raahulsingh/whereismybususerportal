package com.example.whereismybus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Password Reset - Where is my Bus");
        message.setText("Hello,\n\nYou have requested to reset your password.\n" +
                "Please click the link below to reset your password:\n" +
                resetLink + "\n\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "Regards,\nWhere is my Bus Team");
        mailSender.send(message);
    }
}
