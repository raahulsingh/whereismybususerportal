package com.example.whereismybus.controller;

import com.example.whereismybus.dto.BusLocationUpdateDto;
import com.example.whereismybus.service.TrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver")
public class DriverController {
    private final TrackingService service;
    public DriverController(TrackingService service) { this.service = service; }

    @PostMapping("/updateLocation")
    public ResponseEntity<?> update(@Validated @RequestBody BusLocationUpdateDto req) {
        service.recordLocation(req);
        return ResponseEntity.ok().body(java.util.Map.of("status","ok"));
    }
}
