package com.example.whereismybus.controller;

import com.example.whereismybus.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * PlanController
 *
 * Exposes the plan route API used by the frontend.
 * - POST /api/plan   -> accepts { fromStopName, toStopName, departureTime }
 *
 * NOTE: Trip details endpoint (/api/trips/{id}/details) is intentionally
 * NOT present here to avoid duplicate mappings. That belongs to TripController.
 *
 * Fix: PlanRequest now uses stop NAMES (String) instead of stop IDs (Long),
 * matching the updated RouteService.findRoutes(String, String, String) signature.
 * Frontend must send "fromStopName" / "toStopName" keys instead of "fromStopId" / "toStopId".
 */
@RestController
@RequestMapping("/api")
public class PlanController {

    @Autowired
    private RouteService routeService;

    /**
     * PlanRequest - binds incoming JSON from frontend.
     *
     * Frontend body example:
     * {
     *   "fromStopName": "Dehradun",
     *   "toStopName":   "Kashmere Gate",
     *   "departureTime": "2025-11-16T20:00:00Z"
     * }
     */
    public record PlanRequest(String fromStopName, String toStopName, String departureTime) {}

    /**
     * POST /api/plan
     */
    @PostMapping("/plan")
    public ResponseEntity<?> planRoute(@RequestBody PlanRequest req) {
        if (req == null || req.fromStopName() == null || req.toStopName() == null
                || req.fromStopName().isBlank() || req.toStopName().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "fromStopName and toStopName are required"));
        }

        try {
            List<Map<String, Object>> routes = routeService.findRoutes(
                    req.fromStopName(), req.toStopName(), req.departureTime());
            return ResponseEntity.ok(Map.of("routeOptions", routes));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "server_error", "message", ex.getMessage()));
        }
    }

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}