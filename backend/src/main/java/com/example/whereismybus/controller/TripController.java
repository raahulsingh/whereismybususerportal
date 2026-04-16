package com.example.whereismybus.controller;

import com.example.whereismybus.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TripController {

    @Autowired
    private RouteService routeService;

    @GetMapping("/trips/{tripId}/details")
    public ResponseEntity<Map<String, Object>> getTripDetails(@PathVariable("tripId") Long tripId) {
        Map<String, Object> details = routeService.getTripDetails(tripId);
        if (details == null || details.containsKey("error")) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }
}
