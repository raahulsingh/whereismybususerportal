package com.example.whereismybus.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/booking")
public class BookingController {

    private final JdbcTemplate jdbc;

    public BookingController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── Generate standard 2+2 layout (40 seats) ──────────────────
    private String generate2x2Layout() {
        List<Map<String, Object>> seats = new ArrayList<>();
        String[] cols = {"A", "B", "C", "D"};
        int seatNum = 1;
        for (int row = 0; row < 10; row++) {
            for (int col = 0; col < 4; col++) {
                Map<String, Object> seat = new LinkedHashMap<>();
                seat.put("seatNo", cols[col] + (row + 1));
                seat.put("row", row);
                seat.put("col", col);
                seat.put("type", (col == 0 || col == 3) ? "window" : "aisle");
                seats.add(seat);
                seatNum++;
            }
        }
        // Convert to JSON manually
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < seats.size(); i++) {
            Map<String, Object> s = seats.get(i);
            sb.append(String.format(
                    "{\"seatNo\":\"%s\",\"row\":%d,\"col\":%d,\"type\":\"%s\"}",
                    s.get("seatNo"), s.get("row"), s.get("col"), s.get("type")
            ));
            if (i < seats.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    // ── AUTH ──────────────────────────────────────────────────────

    @PostMapping("/admin/login")
    public ResponseEntity<?> bookingAdminLogin(@RequestBody Map<String, String> body) {
        String pw = body.getOrDefault("password", "");
        try {
            String stored = jdbc.queryForObject(
                    "SELECT password FROM admin_credentials WHERE role = 'booking'", String.class);
            if (pw.equals(stored)) return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception ignored) {}
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Wrong password"));
    }

    // ── SEARCH TRIPS ──────────────────────────────────────────────

    /**
     * POST /api/booking/search
     * Body: { "fromStop": "Delhi", "toStop": "Haldwani", "date": "2026-04-11" }
     * Returns trips with price, available seats, timing
     */
    @PostMapping("/search")
    public ResponseEntity<?> searchTrips(@RequestBody Map<String, String> body) {
        try {
            String fromStop = body.get("fromStop");
            String toStop   = body.get("toStop");
            String date     = body.get("date"); // yyyy-MM-dd

            // Project trip times to requested date — so same bus shows for any date
            // Price = basePrice + toStop.priceOffset - fromStop.priceOffset
            String sql = """
                SELECT DISTINCT
                    t.id AS tripId,
                    b.code AS busCode,
                    b.id AS busId,
                    r.id AS routeId,
                    r.name AS routeName,
                    s_from.id AS fromStopId,
                    s_to.id AS toStopId,
                    s_from.name AS fromStopName,
                    s_to.name AS toStopName,
                    st_from.seq AS fromSeq,
                    st_to.seq AS toSeq,
                    CONCAT(?, ' ', TIME(COALESCE(st_from.departure_datetime, st_from.arrival_datetime))) AS fromTime,
                    CONCAT(?, ' ', TIME(COALESCE(st_to.arrival_datetime, st_to.departure_datetime))) AS toTime,
                    COALESCE(rp.base_price, 500) AS basePrice,
                    COALESCE(rs_from.price_offset, 0) AS fromOffset,
                    COALESCE(rs_to.price_offset, 0) AS toOffset,
                    COALESCE(rs_from.sleeper_price_offset, 0) AS fromSleeperOffset,
                    COALESCE(rs_to.sleeper_price_offset, 0) AS toSleeperOffset
                FROM trips t
                JOIN buses b ON b.id = t.bus_id
                JOIN routes r ON r.id = t.route_id
                JOIN stop_times st_from ON st_from.trip_id = t.id
                JOIN stops s_from ON s_from.id = st_from.stop_id
                JOIN stop_times st_to ON st_to.trip_id = t.id
                JOIN stops s_to ON s_to.id = st_to.stop_id
                LEFT JOIN route_pricing rp ON rp.route_id = r.id
                LEFT JOIN route_stops rs_from ON rs_from.route_id = r.id AND rs_from.stop_id = s_from.id
                LEFT JOIN route_stops rs_to ON rs_to.route_id = r.id AND rs_to.stop_id = s_to.id
                WHERE TRIM(LOWER(s_from.name)) = TRIM(LOWER(?))
                  AND TRIM(LOWER(s_to.name)) = TRIM(LOWER(?))
                  AND st_from.seq < st_to.seq
                  AND t.status != 'cancelled'
                  AND t.id IN (
                      SELECT MAX(t2.id) FROM trips t2
                      GROUP BY t2.bus_id
                  )
                ORDER BY fromTime ASC
                """;

            List<Map<String, Object>> rows = jdbc.queryForList(sql,
                    date, date,
                    fromStop.trim(), toStop.trim());

            // Calculate segment price for each row (seat + sleeper)
            for (Map<String, Object> row : rows) {
                double basePrice  = ((Number) row.get("basePrice")).doubleValue();
                double fromOffset = ((Number) row.get("fromOffset")).doubleValue();
                double toOffset   = ((Number) row.get("toOffset")).doubleValue();
                double fromSleeperOffset = ((Number) row.get("fromSleeperOffset")).doubleValue();
                double toSleeperOffset   = ((Number) row.get("toSleeperOffset")).doubleValue();

                // When stop-wise offsets are configured, use pure offset pricing
                // Offsets represent cumulative fare from origin
                double segPrice;
                if (toOffset > 0) {
                    segPrice = Math.max(toOffset - fromOffset, 0);
                } else {
                    segPrice = basePrice; // fallback to route base price
                }

                double sleeperPrice;
                if (toSleeperOffset > 0) {
                    sleeperPrice = Math.max(toSleeperOffset - fromSleeperOffset, 0);
                } else if (segPrice > 0) {
                    sleeperPrice = Math.round(segPrice * 1.5); // default sleeper = 1.5x seat
                } else {
                    sleeperPrice = basePrice;
                }

                row.put("price", segPrice);
                row.put("sleeperPrice", sleeperPrice);
                // Remove internal fields from response
                row.remove("fromOffset"); row.remove("toOffset"); row.remove("basePrice");
                row.remove("fromSleeperOffset"); row.remove("toSleeperOffset");
            }

            // For each trip, count available seats — segment-aware
            for (Map<String, Object> row : rows) {
                Long tripId = ((Number) row.get("tripId")).longValue();
                Long busId  = ((Number) row.get("busId")).longValue();
                int reqFromSeq = ((Number) row.get("fromSeq")).intValue();
                int reqToSeq   = ((Number) row.get("toSeq")).intValue();

                int totalSeats = 40;
                try {
                    Integer ts = jdbc.queryForObject(
                            "SELECT total_seats FROM seat_layouts WHERE bus_id = ?", Integer.class, busId);
                    if (ts != null) totalSeats = ts;
                } catch (Exception ignored) {}

                // Count DISTINCT seats with overlapping segments for this date
                int booked = 0;
                try {
                    Integer b = jdbc.queryForObject("""
                        SELECT COUNT(DISTINCT b.seat_no)
                        FROM bookings b
                        WHERE b.trip_id = ?
                          AND b.travel_date = ?
                          AND b.status = 'confirmed'
                          AND (
                              SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                              WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.from_stop_name)
                              LIMIT 1
                          ) < ?
                          AND (
                              SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                              WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.to_stop_name)
                              LIMIT 1
                          ) > ?
                        """, Integer.class, tripId, date, reqToSeq, reqFromSeq);
                    if (b != null) booked = b;
                } catch (Exception ignored) {}

                row.put("totalSeats", totalSeats);
                row.put("bookedSeats", booked);
                row.put("availableSeats", totalSeats - booked);
            }

            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── ADMIN: SEAT LAYOUT MANAGEMENT ──────────────────────────────

    /**
     * GET /api/booking/admin/buses/{busId}/layout
     * Returns the stored layout for a bus
     */
    @GetMapping("/admin/buses/{busId}/layout")
    public ResponseEntity<?> getBusLayout(@PathVariable("busId") Long busId) {
        try {
            String layoutJson;
            int totalSeats;
            try {
                Map<String, Object> row = jdbc.queryForMap(
                        "SELECT layout_json, total_seats FROM seat_layouts WHERE bus_id = ?", busId);
                layoutJson = (String) row.get("layout_json");
                totalSeats = ((Number) row.get("total_seats")).intValue();
            } catch (Exception e) {
                return ResponseEntity.ok(Map.of("busId", busId, "layoutJson", "", "totalSeats", 0));
            }
            return ResponseEntity.ok(Map.of("busId", busId, "layoutJson", layoutJson, "totalSeats", totalSeats));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/booking/admin/buses/{busId}/layout
     * Save or update seat layout for a bus
     * Body: { "layoutJson": "[...]", "totalSeats": 40 }
     */
    @PostMapping("/admin/buses/{busId}/layout")
    public ResponseEntity<?> saveBusLayout(@PathVariable("busId") Long busId,
                                            @RequestBody Map<String, Object> body) {
        try {
            String layoutJson = body.get("layoutJson").toString();
            int totalSeats = Integer.parseInt(body.get("totalSeats").toString());

            jdbc.update("""
                INSERT INTO seat_layouts (bus_id, total_seats, layout_json)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE total_seats = VALUES(total_seats), layout_json = VALUES(layout_json)
                """, busId, totalSeats, layoutJson);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "busId", busId,
                    "totalSeats", totalSeats,
                    "message", "Layout saved successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── SEAT LAYOUT ───────────────────────────────────────────────


    /**
     * GET /api/booking/trips/{tripId}/seats
     * Returns seat layout with booked status for a trip
     */
    @GetMapping("/trips/{tripId}/seats")
    public ResponseEntity<?> getSeatLayout(
            @PathVariable("tripId") Long tripId,
            @RequestParam(name = "date", required = false) String date,
            HttpServletRequest request) {
        try {
            Long busId = jdbc.queryForObject(
                    "SELECT bus_id FROM trips WHERE id = ?", Long.class, tripId);

            String layoutJson;
            try {
                layoutJson = jdbc.queryForObject(
                        "SELECT layout_json FROM seat_layouts WHERE bus_id = ?", String.class, busId);
            } catch (Exception e) {
                layoutJson = generate2x2Layout();
                jdbc.update(
                        "INSERT IGNORE INTO seat_layouts (bus_id, total_seats, layout_json) VALUES (?, 40, ?)",
                        busId, layoutJson);
            }

            // ✅ Segment-aware seat check: seat is "booked" only if segments overlap
            // A seat booked Ara→Aurangabad should be FREE for Aurangabad→Mango
            // Overlap check: existing.fromSeq < requested.toSeq AND existing.toSeq > requested.fromSeq
            String fromStopParam = request.getParameter("fromStop");
            String toStopParam   = request.getParameter("toStop");

            List<String> bookedSeats;
            if (date != null && !date.isBlank() && fromStopParam != null && toStopParam != null) {
                // Get seq numbers for requested from/to stops on this trip
                String seqSql = """
                    SELECT
                        (SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                         WHERE st.trip_id = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(?)) LIMIT 1) AS fromSeq,
                        (SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                         WHERE st.trip_id = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(?)) LIMIT 1) AS toSeq
                    """;
                Map<String, Object> seqs;
                try {
                    seqs = jdbc.queryForMap(seqSql, tripId, fromStopParam.trim(), tripId, toStopParam.trim());
                } catch (Exception e) {
                    seqs = new HashMap<>();
                }
                Object fromSeqObj = seqs.get("fromSeq");
                Object toSeqObj   = seqs.get("toSeq");

                if (fromSeqObj != null && toSeqObj != null) {
                    int reqFromSeq = ((Number) fromSeqObj).intValue();
                    int reqToSeq   = ((Number) toSeqObj).intValue();
                    // Booked if: existing booking's segment overlaps with requested segment
                    // We store stop names, so resolve seq from stop_times for each booking
                    bookedSeats = jdbc.queryForList("""
                        SELECT DISTINCT b.seat_no
                        FROM bookings b
                        WHERE b.trip_id = ?
                          AND b.travel_date = ?
                          AND b.status = 'confirmed'
                          AND (
                              SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                              WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.from_stop_name)
                              LIMIT 1
                          ) < ?
                          AND (
                              SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                              WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.to_stop_name)
                              LIMIT 1
                          ) > ?
                        """, String.class, tripId, date, reqToSeq, reqFromSeq);
                } else {
                    // Fallback: return all booked seats for this date
                    bookedSeats = jdbc.queryForList(
                            "SELECT seat_no FROM bookings WHERE trip_id = ? AND travel_date = ? AND status = 'confirmed'",
                            String.class, tripId, date);
                }
            } else if (date != null && !date.isBlank()) {
                bookedSeats = jdbc.queryForList(
                        "SELECT seat_no FROM bookings WHERE trip_id = ? AND travel_date = ? AND status = 'confirmed'",
                        String.class, tripId, date);
            } else {
                bookedSeats = jdbc.queryForList(
                        "SELECT seat_no FROM bookings WHERE trip_id = ? AND status = 'confirmed'",
                        String.class, tripId);
            }

            return ResponseEntity.ok(Map.of(
                    "layoutJson", layoutJson,
                    "bookedSeats", bookedSeats,
                    "tripId", tripId,
                    "busId", busId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── BOOK SEAT ─────────────────────────────────────────────────

    /**
     * POST /api/booking/book
     * Body: { tripId, seatNo, passengerName, passengerAge, passengerGender,
     *         passengerPhone, passengerEmail, fromStop, toStop, amount }
     */
    @PostMapping("/book")
    public ResponseEntity<?> bookSeat(@RequestBody Map<String, Object> body) {
        try {
            Long   tripId  = Long.valueOf(body.get("tripId").toString());
            String seatNo  = body.get("seatNo").toString();

            // ✅ Get travel date from request
            String travelDate = body.getOrDefault("travelDate", "").toString();
            String fromStop   = body.getOrDefault("fromStop", "").toString();
            String toStop     = body.getOrDefault("toStop", "").toString();

            // ✅ Segment-aware duplicate check: only block if existing booking overlaps
            // Get seq numbers for the requested from/to stops
            Integer reqFromSeq = null;
            Integer reqToSeq   = null;
            try {
                reqFromSeq = jdbc.queryForObject(
                    "SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id WHERE st.trip_id = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(?)) LIMIT 1",
                    Integer.class, tripId, fromStop.trim());
                reqToSeq = jdbc.queryForObject(
                    "SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id WHERE st.trip_id = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(?)) LIMIT 1",
                    Integer.class, tripId, toStop.trim());
            } catch (Exception ignored) {}

            if (reqFromSeq != null && reqToSeq != null) {
                // Check for overlapping bookings on the same seat
                Integer existing = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM bookings b
                    WHERE b.trip_id = ? AND b.seat_no = ? AND b.travel_date = ? AND b.status = 'confirmed'
                      AND (
                          SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                          WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.from_stop_name)
                          LIMIT 1
                      ) < ?
                      AND (
                          SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id
                          WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.to_stop_name)
                          LIMIT 1
                      ) > ?
                    """, Integer.class, tripId, seatNo, travelDate, reqToSeq, reqFromSeq);
                if (existing != null && existing > 0) {
                    return ResponseEntity.status(409).body(Map.of("error", "Seat already booked for this segment!"));
                }
            } else {
                // Fallback: simple check if seq lookup fails
                Integer existing = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM bookings WHERE trip_id = ? AND seat_no = ? AND travel_date = ? AND status = 'confirmed'",
                    Integer.class, tripId, seatNo, travelDate);
                if (existing != null && existing > 0) {
                    return ResponseEntity.status(409).body(Map.of("error", "Seat already booked for this date!"));
                }
            }

            String ref = "WB-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + String.format("%05d", (int)(Math.random() * 99999));

            Long userId = body.containsKey("userId") && body.get("userId") != null 
                    ? Long.valueOf(body.get("userId").toString()) : null;

            jdbc.update("""
                INSERT INTO bookings
                (booking_ref, trip_id, seat_no, passenger_name, passenger_age,
                 passenger_gender, passenger_phone, passenger_email,
                 from_stop_name, to_stop_name, amount, status, booked_at, travel_date, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW(), ?, ?)
                """,
                    ref, tripId, seatNo,
                    body.get("passengerName"),
                    body.containsKey("passengerAge") && body.get("passengerAge") != null
                            && !body.get("passengerAge").toString().isBlank()
                            ? Integer.valueOf(body.get("passengerAge").toString()) : null,
                    body.getOrDefault("passengerGender", ""),
                    body.get("passengerPhone"),
                    body.getOrDefault("passengerEmail", ""),
                    body.get("fromStop"),
                    body.get("toStop"),
                    Double.valueOf(body.get("amount").toString()),
                    travelDate,
                    userId
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "bookingRef", ref,
                    "message", "Seat " + seatNo + " booked successfully!"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── BOOKING LOOKUP ────────────────────────────────────────────

    @GetMapping("/lookup/{ref}")
    public ResponseEntity<?> lookupBooking(@PathVariable("ref") String ref) {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT * FROM bookings WHERE booking_ref = ?", ref);
            if (rows.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));
            return ResponseEntity.ok(rows.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── ADMIN: ALL BOOKINGS ───────────────────────────────────────

    @GetMapping("/admin/bookings")
    public ResponseEntity<?> getAllBookings(
            @RequestParam(name = "date", required = false) String date,
            @RequestParam(name = "tripId", required = false) Long tripId) {
        try {
            // Step 1: fetch bookings with optional filters
            String baseSql = "SELECT * FROM bookings WHERE 1=1";
            List<Object> params = new ArrayList<>();
            if (date != null && !date.isEmpty()) {
                baseSql += " AND DATE(booked_at) = ?";
                params.add(date);
            }
            if (tripId != null) {
                baseSql += " AND trip_id = ?";
                params.add(tripId);
            }
            baseSql += " ORDER BY booked_at DESC";
            List<Map<String, Object>> bookings = jdbc.queryForList(baseSql, params.toArray());

            // Step 2: enrich each booking with busCode and routeName separately
            for (Map<String, Object> bk : bookings) {
                try {
                    Object tripIdObj = bk.get("trip_id");
                    if (tripIdObj != null) {
                        Long tid = ((Number) tripIdObj).longValue();
                        List<Map<String, Object>> info = jdbc.queryForList(
                                "SELECT b.code AS busCode, r.name AS routeName " +
                                        "FROM trips t " +
                                        "LEFT JOIN buses b ON b.id = t.bus_id " +
                                        "LEFT JOIN routes r ON r.id = t.route_id " +
                                        "WHERE t.id = ?", tid);
                        if (!info.isEmpty()) {
                            bk.put("busCode", info.get(0).get("busCode"));
                            bk.put("routeName", info.get(0).get("routeName"));
                        }
                    }
                } catch (Exception ignored) {
                    bk.put("busCode", "—");
                    bk.put("routeName", "—");
                }
            }
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/bookings/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable("id") Long id) {
        jdbc.update("UPDATE bookings SET status = 'cancelled' WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("cancelled", id));
    }

    // ── ADMIN: PRICING ────────────────────────────────────────────

    @GetMapping("/admin/pricing")
    public ResponseEntity<?> getPricing() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT r.id AS route_id, r.name AS routeName,
                   COALESCE(rp.base_price, 0) AS base_price
            FROM routes r
            LEFT JOIN route_pricing rp ON rp.route_id = r.id
            ORDER BY r.name
            """);
        return ResponseEntity.ok(rows);
    }

    @PutMapping("/admin/pricing/{routeId}")
    public ResponseEntity<?> updatePricing(@PathVariable("routeId") Long routeId,
                                           @RequestBody Map<String, Object> body) {
        double price = Double.parseDouble(body.get("price").toString());
        jdbc.update("""
            INSERT INTO route_pricing (route_id, base_price) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE base_price = VALUES(base_price)
            """, routeId, price);
        return ResponseEntity.ok(Map.of("updated", routeId, "price", price));
    }



    // ── ADMIN: CHANGE PASSWORD ────────────────────────────────────

    @PutMapping("/admin/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        String current = body.get("current");
        String newPw   = body.get("newPassword");
        try {
            String stored = jdbc.queryForObject(
                    "SELECT password FROM admin_credentials WHERE role = 'booking'", String.class);
            if (!current.equals(stored))
                return ResponseEntity.status(401).body(Map.of("error", "Current password wrong"));
            jdbc.update("UPDATE admin_credentials SET password = ? WHERE role = 'booking'", newPw);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── USER BOOKINGS ─────────────────────────────────────────────

    @GetMapping("/user/bookings")
    public ResponseEntity<?> getUserBookings(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String token = authHeader.substring(7);
        try {
            Long userId = jdbc.queryForObject("SELECT id FROM users WHERE session_token = ?", Long.class, token);
            if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

            String sql = """
                SELECT b.*, t.bus_id, bs.code AS bus_code, bs.plate AS bus_plate, r.name AS route_name, CONCAT(b.travel_date, ' ', TIME(COALESCE(st_from.departure_datetime, st_from.arrival_datetime))) AS dep_time
                FROM bookings b
                JOIN trips t ON t.id = b.trip_id
                JOIN buses bs ON bs.id = t.bus_id
                JOIN routes r ON r.id = t.route_id
                LEFT JOIN stop_times st_from ON st_from.trip_id = t.id 
                     AND st_from.stop_id IN (SELECT s.id FROM stops s WHERE TRIM(LOWER(s.name)) = TRIM(LOWER(b.from_stop_name)))
                WHERE b.user_id = ?
                ORDER BY b.booked_at DESC
                """;
            List<Map<String, Object>> bookings = jdbc.queryForList(sql, userId);

            for (Map<String, Object> bk : bookings) {
                if (bk.get("dep_time") != null) {
                    bk.put("dep_time", bk.get("dep_time").toString());
                } else {
                    bk.put("dep_time", bk.get("travel_date") + " 00:00:00");
                }
            }

            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Session invalid or missing user."));
        }
    }
}