package com.example.whereismybus.controller;

import com.example.whereismybus.dto.BusLocationUpdateDto;
import com.example.whereismybus.dto.LiveBusDTO;
import com.example.whereismybus.service.TrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/location")
public class BusLocationController {

    private final TrackingService trackingService;

    public BusLocationController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    // Driver / simulator sends GPS ping
    @PostMapping("/location")
    public ResponseEntity<?> updateLocation(@RequestBody BusLocationUpdateDto dto) {
        if (dto == null || dto.getBusId() == null || dto.getLat() == null || dto.getLng() == null) {
            return ResponseEntity.badRequest().body("Missing required fields: busId/lat/lng");
        }

        trackingService.recordLocation(dto);
        return ResponseEntity.ok(Map.of("status", "ok", "busId", dto.getBusId()));
    }

    // Latest info for one bus
    @GetMapping("/latest/{busId}")
    public ResponseEntity<?> latest(@PathVariable("busId") Long busId) {
        Optional<LiveBusDTO> latestBus = trackingService.getLiveBuses(null).stream()
                .filter(b -> Objects.equals(b.getBusId(), busId))
                .findFirst();

        return latestBus
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ✅ FRONTEND USES THIS: returns LiveBusDTO, not BusLocation
    @GetMapping("/latest/all")
    public List<LiveBusDTO> latestAll(@RequestParam(value = "routeId", required = false) Long routeId) {
        return trackingService.getLiveBuses(routeId);
    }
}
