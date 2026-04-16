package com.example.whereismybus.controller;

import com.example.whereismybus.entity.*;
import com.example.whereismybus.repo.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.List;
import java.util.Map;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final RouteRepo routeRepo;
    private final StopRepo stopRepo;
    private final BusRepo busRepo;
    private final DriverRepo driverRepo;
    private final JdbcTemplate jdbc;

    // Simple hardcoded admin password — move to application.properties for production
    private static final String ADMIN_PASSWORD = "R@hul@25June";

    public AdminController(RouteRepo routeRepo, StopRepo stopRepo,
                           BusRepo busRepo, DriverRepo driverRepo,
                           JdbcTemplate jdbc) {
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.busRepo = busRepo;
        this.driverRepo = driverRepo;
        this.jdbc = jdbc;
    }

    // ================= AUTH =================

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String pw = body.getOrDefault("password", "");
        if (ADMIN_PASSWORD.equals(pw)) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Wrong password"));
    }

    // ================= ROUTES =================

    @GetMapping("/routes")
    public List<Route> getRoutes() {
        return routeRepo.findAll();
    }

    @PostMapping("/routes")
    public Route addRoute(@RequestBody Route route) {
        return routeRepo.save(route);
    }

    @Transactional
    @DeleteMapping("/routes/{id}")
    public ResponseEntity<?> deleteRoute(@PathVariable("id") Long id) {
        try {
            // 1) Delete bus_state entries referencing this route (via route_id or bus_id)
            //    First nullify active_trip_id to avoid FK issues, then delete bus_state rows for buses on this route
            jdbc.update("UPDATE bus_state SET active_trip_id = NULL WHERE route_id = ?", id);
            jdbc.update("DELETE FROM bus_state WHERE route_id = ?", id);

            // 2) Delete bookings referencing trips on this route
            jdbc.update("DELETE b FROM bookings b JOIN trips t ON b.trip_id = t.id WHERE t.route_id = ?", id);

            // 3) Delete stop_times referencing trips on this route
            jdbc.update("DELETE st FROM stop_times st JOIN trips t ON st.trip_id = t.id WHERE t.route_id = ?", id);

            // 4) Delete trips on this route
            jdbc.update("DELETE FROM trips WHERE route_id = ?", id);

            // 5) Delete bus_locations referencing buses on this route
            jdbc.update("DELETE bl FROM bus_locations bl JOIN buses bu ON bl.bus_id = bu.id WHERE bu.route_id = ?", id);

            // 6) Delete seat_layouts referencing buses on this route
            jdbc.update("DELETE sl FROM seat_layouts sl JOIN buses bu ON sl.bus_id = bu.id WHERE bu.route_id = ?", id);

            // 7) Delete buses on this route
            jdbc.update("DELETE FROM buses WHERE route_id = ?", id);

            // 8) Delete stop_times referencing stops on this route
            jdbc.update("DELETE st FROM stop_times st JOIN stops s ON st.stop_id = s.id WHERE s.route_id = ?", id);

            // 9) Delete route_stops entries
            jdbc.update("DELETE FROM route_stops WHERE route_id = ?", id);

            // 10) Delete stops on this route
            jdbc.update("DELETE FROM stops WHERE route_id = ?", id);

            // 11) Delete route_pricing
            jdbc.update("DELETE FROM route_pricing WHERE route_id = ?", id);

            // 12) Finally delete the route itself
            routeRepo.deleteById(id);

            return ResponseEntity.ok(Map.of("deleted", id, "message", "Route and all related data deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ================= STOPS =================

    /**
     * GET /api/admin/routes/{id}/stops
     * ✅ UPDATED: Also returns offsetMin from route_stops table so frontend can display it.
     */
    @GetMapping("/routes/{id}/stops")
    public List<Map<String, Object>> getStops(@PathVariable("id") Long id) {
        String sql = """
                SELECT s.id, s.name, s.lat, s.lng, s.seq, rs.offset_min AS offsetMin,
                       COALESCE(rs.price_offset, 0) AS priceOffset,
                       COALESCE(rs.sleeper_price_offset, 0) AS sleeperPriceOffset
                FROM stops s
                LEFT JOIN route_stops rs ON rs.stop_id = s.id AND rs.route_id = ?
                WHERE s.route_id = ?
                ORDER BY s.seq ASC
                """;
        return jdbc.queryForList(sql, id, id);
    }

    /**
     * POST /api/admin/routes/{id}/stops
     * ✅ UPDATED: Now also inserts a row into route_stops with offsetMin.
     * offsetMin is required — it defines when the bus arrives at this stop
     * relative to the trip's departure time. Used to auto-generate stop_times
     * when a trip is created.
     *
     * Body: { "name": "Roorkee", "lat": 29.86, "lng": 77.89, "seq": 3, "offsetMin": 60 }
     */
    @PostMapping("/routes/{id}/stops")
    public ResponseEntity<?> addStop(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        try {
            Route route = routeRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Route not found"));

            // 1) Save stop
            Stop s = new Stop();
            s.setRoute(route);
            s.setName(body.get("name").toString());
            s.setLat(BigDecimal.valueOf(Double.parseDouble(body.get("lat").toString())));   // ✅ FIXED
            s.setLng(BigDecimal.valueOf(Double.parseDouble(body.get("lng").toString())));   // ✅ FIXED
            s.setSeq(Integer.parseInt(body.get("seq").toString()));
            Stop saved = stopRepo.save(s);

            // 2) ✅ Insert into route_stops with offsetMin, priceOffset, sleeperPriceOffset
            int offsetMin = body.containsKey("offsetMin")
                    ? Integer.parseInt(body.get("offsetMin").toString())
                    : 0;
            int priceOffset = body.containsKey("priceOffset")
                    ? Integer.parseInt(body.get("priceOffset").toString())
                    : 0;
            int sleeperPriceOffset = body.containsKey("sleeperPriceOffset")
                    ? Integer.parseInt(body.get("sleeperPriceOffset").toString())
                    : 0;

            jdbc.update(
                    """
                    INSERT INTO route_stops (route_id, stop_id, seq, offset_min, price_offset, sleeper_price_offset)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE offset_min = VALUES(offset_min), stop_id = VALUES(stop_id),
                        price_offset = VALUES(price_offset), sleeper_price_offset = VALUES(sleeper_price_offset)
                    """,
                    id, saved.getId(), saved.getSeq(), offsetMin, priceOffset, sleeperPriceOffset
            );

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/admin/stops/{stopId}
     * ✅ UPDATED: Also updates route_stops.offset_min if offsetMin is provided.
     */
    @PutMapping("/stops/{stopId}")
    public ResponseEntity<?> updateStop(@PathVariable("stopId") Long stopId,
                                        @RequestBody Map<String, Object> body) {
        try {
            Stop s = stopRepo.findById(stopId)
                    .orElseThrow(() -> new RuntimeException("Stop not found"));
            s.setName(body.get("name").toString());
            s.setLat(BigDecimal.valueOf(Double.parseDouble(body.get("lat").toString())));   // ✅ FIXED
            s.setLng(BigDecimal.valueOf(Double.parseDouble(body.get("lng").toString())));   // ✅ FIXED
            s.setSeq(Integer.parseInt(body.get("seq").toString()));
            Stop saved = stopRepo.save(s);

            // ✅ Update route_stops fields if provided
            if (body.containsKey("offsetMin")) {
                int offsetMin = Integer.parseInt(body.get("offsetMin").toString());
                if (body.containsKey("priceOffset") || body.containsKey("sleeperPriceOffset")) {
                    int priceOffset = body.containsKey("priceOffset")
                            ? Integer.parseInt(body.get("priceOffset").toString()) : 0;
                    int sleeperPriceOffset = body.containsKey("sleeperPriceOffset")
                            ? Integer.parseInt(body.get("sleeperPriceOffset").toString()) : 0;
                    jdbc.update(
                            "UPDATE route_stops SET offset_min = ?, seq = ?, price_offset = ?, sleeper_price_offset = ? WHERE stop_id = ?",
                            offsetMin, saved.getSeq(), priceOffset, sleeperPriceOffset, stopId
                    );
                } else {
                    // Update offset and seq but preserve existing pricing
                    jdbc.update(
                            "UPDATE route_stops SET offset_min = ?, seq = ? WHERE stop_id = ?",
                            offsetMin, saved.getSeq(), stopId
                    );
                }
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @Transactional
    @DeleteMapping("/stops/{stopId}")
    public ResponseEntity<?> deleteStop(@PathVariable("stopId") Long stopId) {
        try {
            // 1) Delete stop_times referencing this stop
            jdbc.update("DELETE FROM stop_times WHERE stop_id = ?", stopId);

            // 2) Nullify bus_state.nearest_stop_id if pointing to this stop
            jdbc.update("UPDATE bus_state SET nearest_stop_id = NULL WHERE nearest_stop_id = ?", stopId);

            // 3) Delete route_stops entry
            jdbc.update("DELETE FROM route_stops WHERE stop_id = ?", stopId);

            // 4) Delete the stop
            stopRepo.deleteById(stopId);

            return ResponseEntity.ok(Map.of("deleted", stopId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ================= DRIVERS =================

    @GetMapping("/drivers")
    public List<Driver> getDrivers() {
        return driverRepo.findAll();
    }

    @PostMapping("/drivers")
    public Driver addDriver(@RequestBody Driver driver) {
        return driverRepo.save(driver);
    }

    @Transactional
    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable("id") Long id) {
        try {
            // Nullify driver_id on buses assigned to this driver (don't delete the buses)
            jdbc.update("UPDATE buses SET driver_id = NULL WHERE driver_id = ?", id);
            driverRepo.deleteById(id);
            return ResponseEntity.ok(Map.of("deleted", id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ================= BUSES =================

    @GetMapping("/routes/{routeId}/buses")
    public List<Bus> getBuses(@PathVariable("routeId") Long routeId) {
        return busRepo.findByRouteIdAndActiveTrue(routeId);
    }

    @PostMapping("/routes/{routeId}/buses")
    public Bus addBus(@PathVariable("routeId") Long routeId,
                      @RequestBody Bus bus) {
        Route route = routeRepo.findById(routeId)
                .orElseThrow(() -> new RuntimeException("Route not found"));
        Driver driver = driverRepo.findById(bus.getDriver().getId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        bus.setRoute(route);
        bus.setDriver(driver);
        bus.setActive(true);
        return busRepo.save(bus);
    }

    @Transactional
    @DeleteMapping("/buses/{busId}")
    public ResponseEntity<?> deleteBus(@PathVariable("busId") Long busId) {
        try {
            // 1) Nullify active_trip_id in bus_state to avoid FK issues, then delete bus_state
            jdbc.update("UPDATE bus_state SET active_trip_id = NULL WHERE bus_id = ?", busId);
            jdbc.update("DELETE FROM bus_state WHERE bus_id = ? OR id = ?", busId, busId);

            // 2) Delete bookings referencing trips for this bus
            jdbc.update("DELETE b FROM bookings b JOIN trips t ON b.trip_id = t.id WHERE t.bus_id = ?", busId);

            // 3) Delete stop_times referencing trips for this bus
            jdbc.update("DELETE st FROM stop_times st JOIN trips t ON st.trip_id = t.id WHERE t.bus_id = ?", busId);

            // 4) Delete trips for this bus
            jdbc.update("DELETE FROM trips WHERE bus_id = ?", busId);

            // 5) Delete bus_locations
            jdbc.update("DELETE FROM bus_locations WHERE bus_id = ?", busId);

            // 6) Delete seat_layouts (has CASCADE but being explicit)
            jdbc.update("DELETE FROM seat_layouts WHERE bus_id = ?", busId);

            // 7) Delete the bus
            busRepo.deleteById(busId);

            return ResponseEntity.ok(Map.of("deleted", busId, "message", "Bus and all related data deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ================= TRIPS =================

    @GetMapping("/routes/{routeId}/trips")
    public List<Map<String, Object>> getTrips(@PathVariable("routeId") Long routeId) {
        String sql = """
                SELECT t.id AS tripId, t.departure_datetime AS departureTime,
                       t.status, b.code AS busCode, b.id AS busId
                FROM trips t
                JOIN buses b ON b.id = t.bus_id
                WHERE t.route_id = ?
                ORDER BY t.departure_datetime DESC
                """;
        return jdbc.queryForList(sql, routeId);
    }

    /**
     * ✅ NEW ENDPOINT: GET /api/admin/trips/{tripId}/stop-times
     * Returns all stop_times for a trip with stop names — shown in the modal.
     * Response: [ { seq, stopId, stopName, arrivalDatetime, departureDatetime }, ... ]
     */
    @GetMapping("/trips/{tripId}/stop-times")
    public ResponseEntity<?> getStopTimes(@PathVariable("tripId") Long tripId) {
        try {
            String sql = """
                    SELECT st.seq, st.stop_id AS stopId, s.name AS stopName,
                           st.arrival_datetime AS arrivalDatetime,
                           st.departure_datetime AS departureDatetime
                    FROM stop_times st
                    JOIN stops s ON s.id = st.stop_id
                    WHERE st.trip_id = ?
                    ORDER BY st.seq ASC
                    """;
            List<Map<String, Object>> rows = jdbc.queryForList(sql, tripId);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/admin/routes/{routeId}/trips
     * Creates a trip AND auto-generates stop_times for every stop on the route
     * using route_stops.offset_min as the time offset from departure.
     *
     * Body: { "busId": 1, "departureTime": "2025-12-01T08:00:00" }
     */
    @PostMapping("/routes/{routeId}/trips")
    public ResponseEntity<?> addTrip(@PathVariable("routeId") Long routeId,
                                     @RequestBody Map<String, Object> body) {
        try {
            Long busId = Long.valueOf(body.get("busId").toString());
            String departureTimeStr = body.get("departureTime").toString();

            routeRepo.findById(routeId)
                    .orElseThrow(() -> new RuntimeException("Route not found"));
            busRepo.findById(busId)
                    .orElseThrow(() -> new RuntimeException("Bus not found"));

            // 1) Insert trip
            jdbc.update(
                    "INSERT INTO trips (route_id, bus_id, departure_datetime, status) VALUES (?, ?, ?, 'scheduled')",
                    routeId, busId, departureTimeStr
            );

            Long tripId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            // 2) Auto-generate stop_times from route_stops offsets
            String stopsSql = """
                    SELECT rs.stop_id, rs.seq, rs.offset_min
                    FROM route_stops rs
                    WHERE rs.route_id = ?
                    ORDER BY rs.seq ASC
                    """;
            List<Map<String, Object>> routeStops = jdbc.queryForList(stopsSql, routeId);

            DateTimeFormatter fmt = new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd'T'HH:mm")
                    .optionalStart()
                    .appendPattern(":ss")
                    .optionalEnd()
                    .toFormatter();
            LocalDateTime departure = LocalDateTime.parse(departureTimeStr, fmt);

            int i = 0;
            for (Map<String, Object> rs : routeStops) {
                Long stopId = ((Number) rs.get("stop_id")).longValue();
                int seq = ((Number) rs.get("seq")).intValue();
                int offsetMin = ((Number) rs.get("offset_min")).intValue();

                LocalDateTime arrivalDt = departure.plusMinutes(offsetMin);
                // Departure at stop = arrival + 2 minutes dwell time
                LocalDateTime departureDt = arrivalDt.plusMinutes(2);

                String arrStr = (i == 0) ? null : arrivalDt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                String depStr = (i == routeStops.size() - 1) ? null : departureDt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                jdbc.update(
                        "INSERT INTO stop_times (trip_id, stop_id, seq, arrival_datetime, departure_datetime) VALUES (?, ?, ?, ?, ?)",
                        tripId, stopId, seq,
                        arrStr,
                        depStr
                );
                i++;
            }

            return ResponseEntity.ok(Map.of(
                    "tripId", tripId,
                    "stopTimesCreated", routeStops.size(),
                    "message", "Trip and stop times created successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/trips/{tripId}")
    public ResponseEntity<?> deleteTrip(@PathVariable("tripId") Long tripId) {
        // stop_times deleted automatically via ON DELETE CASCADE
        jdbc.update("DELETE FROM trips WHERE id = ?", tripId);
        return ResponseEntity.ok(Map.of("deleted", tripId));
    }

    /**
     * ✅ NEW ENDPOINT: POST /api/admin/routes/{routeId}/trips/bulk
     * Creates trips for every day between startDate and endDate at the given time.
     * Auto-generates stop_times for each trip.
     *
     * Body: { "busId": 1, "startDate": "2025-12-01", "endDate": "2025-12-05", "departureTime": "08:00" }
     */
    @Transactional
    @PostMapping("/routes/{routeId}/trips/bulk")
    public ResponseEntity<?> addBulkTrips(@PathVariable("routeId") Long routeId,
                                          @RequestBody Map<String, Object> body) {
        try {
            Long busId = Long.valueOf(body.get("busId").toString());
            String startDateStr = body.get("startDate").toString();
            String endDateStr = body.get("endDate").toString();
            String timeStr = body.get("departureTime").toString();
            int gapDays = 1;
            if (body.containsKey("gapDays") && body.get("gapDays") != null) {
                gapDays = Integer.parseInt(body.get("gapDays").toString());
                if (gapDays < 1) gapDays = 1;
            }

            routeRepo.findById(routeId).orElseThrow(() -> new RuntimeException("Route not found"));
            busRepo.findById(busId).orElseThrow(() -> new RuntimeException("Bus not found"));

            LocalDate start = LocalDate.parse(startDateStr);
            LocalDate end = LocalDate.parse(endDateStr);
            LocalTime time = LocalTime.parse(timeStr);

            if (start.isAfter(end)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "End date must be after start date"));
            }

            int tripsCreated = 0;
            int totalStopTimes = 0;

            String stopsSql = """
                    SELECT rs.stop_id, rs.seq, rs.offset_min
                    FROM route_stops rs
                    WHERE rs.route_id = ?
                    ORDER BY rs.seq ASC
                    """;
            List<Map<String, Object>> routeStops = jdbc.queryForList(stopsSql, routeId);

            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(gapDays)) {
                LocalDateTime departure = LocalDateTime.of(date, time);
                String departureTimeStr = departure.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));

                jdbc.update(
                        "INSERT INTO trips (route_id, bus_id, departure_datetime, status) VALUES (?, ?, ?, 'scheduled')",
                        routeId, busId, departureTimeStr
                );

                Long tripId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
                tripsCreated++;

                int i = 0;
                for (Map<String, Object> rs : routeStops) {
                    Long stopId = ((Number) rs.get("stop_id")).longValue();
                    int seq = ((Number) rs.get("seq")).intValue();
                    int offsetMin = ((Number) rs.get("offset_min")).intValue();

                    LocalDateTime arrivalDt = departure.plusMinutes(offsetMin);
                    LocalDateTime departureDt = arrivalDt.plusMinutes(2);

                    String arrStr = (i == 0) ? null : arrivalDt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    String depStr = (i == routeStops.size() - 1) ? null : departureDt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                    jdbc.update(
                            "INSERT INTO stop_times (trip_id, stop_id, seq, arrival_datetime, departure_datetime) VALUES (?, ?, ?, ?, ?)",
                            tripId, stopId, seq,
                            arrStr,
                            depStr
                    );
                    totalStopTimes++;
                    i++;
                }
            }

            return ResponseEntity.ok(Map.of(
                    "tripsCreated", tripsCreated,
                    "stopTimesCreated", totalStopTimes,
                    "message", tripsCreated + " trips created successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ================= BUS STATE =================

    @GetMapping("/bus-state")
    public List<Map<String, Object>> getBusStates() {
        String sql = """
                SELECT bs.id AS busId, b.code AS busCode, r.name AS routeName,
                       bs.lat, bs.lng, bs.speed_kmph AS speedKmph,
                       bs.heading_deg AS headingDeg, bs.last_ping_at AS lastPingAt,
                       bs.at_stop AS atStop, s.name AS nearestStopName
                FROM bus_state bs
                JOIN buses b ON b.id = bs.bus_id
                LEFT JOIN routes r ON r.id = bs.route_id
                LEFT JOIN stops s ON s.id = bs.nearest_stop_id
                ORDER BY bs.last_ping_at DESC
                """;
        return jdbc.queryForList(sql);
    }

    @PostMapping("/bus-state")
    public ResponseEntity<?> setBusState(@RequestBody Map<String, Object> body) {
        try {
            Long busId = Long.valueOf(body.get("busId").toString());
            double lat = Double.parseDouble(body.get("lat").toString());
            double lng = Double.parseDouble(body.get("lng").toString());
            double speed = body.containsKey("speedKmph") ? Double.parseDouble(body.get("speedKmph").toString()) : 0.0;
            double heading = body.containsKey("headingDeg") ? Double.parseDouble(body.get("headingDeg").toString()) : 0.0;

            Bus bus = busRepo.findById(busId)
                    .orElseThrow(() -> new RuntimeException("Bus not found"));

            Long routeId = bus.getRoute() != null ? bus.getRoute().getId() : null;
            String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSS"));

            // ✅ Get active_trip_id from request
            Long activeTripId = null;
            if (body.containsKey("tripId") && body.get("tripId") != null
                    && !body.get("tripId").toString().isBlank()) {
                activeTripId = Long.valueOf(body.get("tripId").toString());
            }

            // ✅ Get nearest_stop_id from request (stop selected in UI)
            Long nearestStopId = null;
            if (body.containsKey("stopId") && body.get("stopId") != null
                    && !body.get("stopId").toString().isBlank()) {
                nearestStopId = Long.valueOf(body.get("stopId").toString());
            }

            jdbc.update("""
                    INSERT INTO bus_state (id, bus_id, route_id, lat, lng, speed_kmph, heading_deg,
                        last_ping_at, updated_at, at_stop, active_trip_id, nearest_stop_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        lat=VALUES(lat), lng=VALUES(lng), speed_kmph=VALUES(speed_kmph),
                        heading_deg=VALUES(heading_deg), last_ping_at=VALUES(last_ping_at),
                        updated_at=VALUES(updated_at), route_id=VALUES(route_id),
                        active_trip_id=VALUES(active_trip_id),
                        nearest_stop_id=VALUES(nearest_stop_id)
                    """,
                    busId, busId, routeId, lat, lng, speed, heading, now, now,
                    activeTripId, nearestStopId
            );

            return ResponseEntity.ok(Map.of(
                    "updated", busId,
                    "lat", lat, "lng", lng,
                    "activeTripId", activeTripId != null ? activeTripId : "none",
                    "nearestStopId", nearestStopId != null ? nearestStopId : "none"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Get trips for a specific bus (for bus-state trip dropdown)
    @GetMapping("/buses/{busId}/trips")
    public ResponseEntity<?> getTripsForBus(@PathVariable("busId") Long busId) {
        try {
            String sql = """
                SELECT t.id AS tripId,
                       t.departure_datetime AS departureTime,
                       r.name AS routeName,
                       t.status
                FROM trips t
                JOIN routes r ON r.id = t.route_id
                WHERE t.bus_id = ?
                ORDER BY t.departure_datetime DESC
                LIMIT 30
                """;
            List<Map<String, Object>> trips = jdbc.queryForList(sql, busId);
            return ResponseEntity.ok(trips);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}