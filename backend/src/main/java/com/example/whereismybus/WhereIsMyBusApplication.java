package com.example.whereismybus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@SpringBootApplication
public class WhereIsMyBusApplication {

    @PostConstruct
    public void init() {
        // Set application timezone to IST so that LocalDate.now() etc. use correct India Date
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }

    public static void main(String[] args) {
        SpringApplication.run(WhereIsMyBusApplication.class, args);
    }
}
