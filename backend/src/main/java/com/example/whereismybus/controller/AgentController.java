package com.example.whereismybus.controller;

import com.example.whereismybus.entity.Agent;
import com.example.whereismybus.repository.AgentRepository;
import com.example.whereismybus.service.OtpService;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.*;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired
    private AgentRepository agentRepo;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private OtpService otpService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ══════════════════════════════════════════════════════════
    //  AUTH
    // ══════════════════════════════════════════════════════════

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        Optional<Agent> agentOpt = agentRepo.findByEmail(email.trim().toLowerCase());
        if (agentOpt.isPresent()) {
            Agent agent = agentOpt.get();
            if (!agent.getActive()) {
                return ResponseEntity.status(401).body(Map.of("error", "Account is deactivated"));
            }
            if (BCrypt.checkpw(password, agent.getPasswordHash())) {
                String token = UUID.randomUUID().toString();
                agent.setAgentToken(token);
                agent.setTokenExpiry(LocalDateTime.now().plusHours(24));
                agentRepo.save(agent);

                return ResponseEntity.ok(Map.of(
                    "token", token,
                    "agent", Map.of(
                        "id", agent.getId(),
                        "name", agent.getName(),
                        "email", agent.getEmail(),
                        "phone", agent.getPhone()
                    )
                ));
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    // ══════════════════════════════════════════════════════════
    //  MY BUSES
    // ══════════════════════════════════════════════════════════

    @GetMapping("/my-buses")
    public ResponseEntity<?> getMyBuses(@RequestHeader("X-Agent-Token") String token) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        List<Map<String, Object>> buses = jdbc.queryForList("""
            SELECT b.id, b.code, b.plate, b.active,
                   r.id AS route_id, r.name AS route_name,
                   d.id AS driver_id, d.name AS driver_name, d.phone AS driver_phone
            FROM agent_bus_assignments aba
            JOIN buses b ON b.id = aba.bus_id
            LEFT JOIN routes r ON r.id = b.route_id
            LEFT JOIN drivers d ON d.id = b.driver_id
            WHERE aba.agent_id = ?
            """, agent.getId());

        return ResponseEntity.ok(buses);
    }

    // ══════════════════════════════════════════════════════════
    //  SEARCH TRIPS (same as public but filtered to agent's buses)
    // ══════════════════════════════════════════════════════════

    @GetMapping("/search")
    public ResponseEntity<?> searchTrips(
            @RequestHeader("X-Agent-Token") String token,
            @RequestParam("from") String from,
            @RequestParam("to") String to,
            @RequestParam(value = "date", required = false) String date) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        try {
            String sql = """
                SELECT DISTINCT t.id AS tripId, t.departure_datetime,
                       r.name AS routeName, b.id AS busId, b.code AS busCode, b.plate,
                       CONCAT(?, ' ', TIME(COALESCE(st_from.departure_datetime, st_from.arrival_datetime))) AS fromDeparture,
                       CONCAT(?, ' ', TIME(COALESCE(st_to.arrival_datetime, st_to.departure_datetime))) AS toArrival,
                       s_from.name AS fromStop, s_to.name AS toStop,
                       st_from.seq AS fromSeq, st_to.seq AS toSeq,
                       COALESCE(rp.base_price, 500) AS basePrice,
                       COALESCE(rs_from.price_offset, 0) AS fromOffset,
                       COALESCE(rs_to.price_offset, 0) AS toOffset,
                       COALESCE(rs_from.sleeper_price_offset, 0) AS fromSleeperOffset,
                       COALESCE(rs_to.sleeper_price_offset, 0) AS toSleeperOffset
                FROM trips t
                JOIN routes r ON r.id = t.route_id
                JOIN buses b ON b.id = t.bus_id
                JOIN agent_bus_assignments aba ON aba.bus_id = b.id AND aba.agent_id = ?
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
                  AND t.status = 'scheduled'
                """;

            List<Map<String, Object>> rows;
            String searchDate = (date != null && !date.isBlank()) ? date.trim() : "";
            
            if (!searchDate.isEmpty()) {
                sql += " AND DATE(t.departure_datetime) = ? ORDER BY fromDeparture ASC";
                rows = jdbc.queryForList(sql, searchDate, searchDate, agent.getId(), from.trim(), to.trim(), searchDate);
            } else {
                sql += " ORDER BY fromDeparture ASC";
                // If no date provided, use t.departure_datetime's date part as the parameter for CONCAT
                sql = sql.replace("CONCAT(?,", "CONCAT(DATE(t.departure_datetime),");
                rows = jdbc.queryForList(sql, agent.getId(), from.trim(), to.trim());
            }

            // Calculate segment price for each row (seat + sleeper)
            for (Map<String, Object> row : rows) {
                double basePrice  = ((Number) row.get("basePrice")).doubleValue();
                double fromOffset = ((Number) row.get("fromOffset")).doubleValue();
                double toOffset   = ((Number) row.get("toOffset")).doubleValue();
                double fromSleeperOffset = ((Number) row.get("fromSleeperOffset")).doubleValue();
                double toSleeperOffset   = ((Number) row.get("toSleeperOffset")).doubleValue();

                double segPrice;
                if (toOffset > 0) {
                    segPrice = Math.max(toOffset - fromOffset, 0);
                } else {
                    segPrice = basePrice;
                }

                double sleeperPrice;
                if (toSleeperOffset > 0) {
                    sleeperPrice = Math.max(toSleeperOffset - fromSleeperOffset, 0);
                } else if (segPrice > 0) {
                    sleeperPrice = Math.round(segPrice * 1.5);
                } else {
                    sleeperPrice = basePrice;
                }

                row.put("price", segPrice);
                row.put("sleeperPrice", sleeperPrice);
                row.remove("fromOffset"); row.remove("toOffset"); row.remove("basePrice");
                row.remove("fromSleeperOffset"); row.remove("toSleeperOffset");
            }

            // Count available seats
            for (Map<String, Object> row : rows) {
                Long tripId = ((Number) row.get("tripId")).longValue();
                Long busId  = ((Number) row.get("busId")).longValue();
                int reqFromSeq = ((Number) row.get("fromSeq")).intValue();
                int reqToSeq   = ((Number) row.get("toSeq")).intValue();
                String travelDate = searchDate.isEmpty() ? row.get("departure_datetime").toString().split(" ")[0] : searchDate;

                int totalSeats = 40;
                try {
                    Integer ts = jdbc.queryForObject("SELECT total_seats FROM seat_layouts WHERE bus_id = ?", Integer.class, busId);
                    if (ts != null) totalSeats = ts;
                } catch (Exception ignored) {}

                int booked = 0;
                try {
                    Integer b = jdbc.queryForObject("""
                        SELECT COUNT(DISTINCT b.seat_no) FROM bookings b
                        WHERE b.trip_id = ? AND b.travel_date = ? AND b.status = 'confirmed'
                          AND (SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.from_stop_name) LIMIT 1) < ?
                          AND (SELECT st.seq FROM stop_times st JOIN stops s ON s.id = st.stop_id WHERE st.trip_id = b.trip_id AND LOWER(s.name) = LOWER(b.to_stop_name) LIMIT 1) > ?
                        """, Integer.class, tripId, travelDate, reqToSeq, reqFromSeq);
                    if (b != null) booked = b;
                } catch (Exception ignored) {}

                row.put("totalSeats", totalSeats);
                row.put("bookedSeats", booked);
                row.put("availableSeats", totalSeats - booked);
            }
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Search failed"));
        }
    }

    // ══════════════════════════════════════════════════════════
    //  BOOK SEAT (Prepaid or Cash)
    // ══════════════════════════════════════════════════════════

    @Transactional
    @PostMapping("/book")
    public ResponseEntity<?> bookSeat(
            @RequestHeader("X-Agent-Token") String token,
            @RequestBody Map<String, Object> body) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        try {
            Long tripId = Long.valueOf(body.get("tripId").toString());
            String seatNo = body.get("seatNo").toString();
            String travelDate = body.getOrDefault("travelDate", "").toString();
            String fromStop = body.getOrDefault("fromStop", "").toString();
            String toStop = body.getOrDefault("toStop", "").toString();
            String paymentType = body.getOrDefault("paymentType", "prepaid").toString(); // "cash" or "prepaid"

            // ── Verify this bus is assigned to agent ──
            Long busId = jdbc.queryForObject(
                "SELECT bus_id FROM trips WHERE id = ?", Long.class, tripId);
            if (!isAgentBus(agent.getId(), busId)) {
                return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
            }

            // ── Duplicate seat check ──
            Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM bookings WHERE trip_id = ? AND seat_no = ? AND travel_date = ? AND status = 'confirmed'",
                Integer.class, tripId, seatNo, travelDate);
            if (existing != null && existing > 0) {
                return ResponseEntity.status(409).body(Map.of("error", "Seat already booked"));
            }

            String ref = "WB-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    + "-" + String.format("%08d", SECURE_RANDOM.nextInt(99999999));

            double amount = calculateAmount(tripId, fromStop, toStop,
                    body.getOrDefault("seatType", "seat").toString());

            if ("cash".equalsIgnoreCase(paymentType)) {
                // ── Cash booking: send OTP to agent email, store pending booking ──
                // Store booking data temporarily as JSON in a temp key
                String pendingKey = "cash:" + ref;

                jdbc.update("""
                    INSERT INTO bookings
                    (booking_ref, trip_id, seat_no, passenger_name, passenger_age,
                     passenger_gender, passenger_phone, passenger_email,
                     from_stop_name, to_stop_name, amount, status, booked_at, travel_date, user_id, payment_type, agent_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_otp', NOW(), ?, NULL, 'cash', ?)
                    """,
                    ref, tripId, seatNo,
                    body.get("passengerName"),
                    parseAge(body),
                    body.getOrDefault("passengerGender", ""),
                    body.get("passengerPhone"),
                    body.getOrDefault("passengerEmail", ""),
                    fromStop, toStop, amount, travelDate, agent.getId());

                otpService.generateAndSend(pendingKey, agent.getEmail(),
                    "Cash Booking OTP - Where is my Bus",
                    "You are making a cash booking for seat " + seatNo + " on " + travelDate + ".\nBooking Ref: " + ref);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "bookingRef", ref,
                    "otpRequired", true,
                    "message", "OTP sent to your email. Verify to confirm cash booking."
                ));
            } else {
                // ── Prepaid booking: directly confirmed ──
                jdbc.update("""
                    INSERT INTO bookings
                    (booking_ref, trip_id, seat_no, passenger_name, passenger_age,
                     passenger_gender, passenger_phone, passenger_email,
                     from_stop_name, to_stop_name, amount, status, booked_at, travel_date, user_id, payment_type, agent_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', NOW(), ?, NULL, 'prepaid', ?)
                    """,
                    ref, tripId, seatNo,
                    body.get("passengerName"),
                    parseAge(body),
                    body.getOrDefault("passengerGender", ""),
                    body.get("passengerPhone"),
                    body.getOrDefault("passengerEmail", ""),
                    fromStop, toStop, amount, travelDate, agent.getId());

                String busInfo = "";
                String depTime = "";
                try {
                    List<Map<String, Object>> tripInfos = jdbc.queryForList("""
                        SELECT CONCAT(b.code, ' (', b.plate, ')') AS bus_info,
                               CONCAT(?, ' ', TIME(COALESCE(st.departure_datetime, st.arrival_datetime))) AS dep_time
                        FROM trips t
                        JOIN buses b ON b.id = t.bus_id
                        JOIN stop_times st ON st.trip_id = t.id
                        JOIN stops s ON s.id = st.stop_id
                        WHERE t.id = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(?))
                        LIMIT 1
                    """, travelDate, tripId, fromStop.trim());
                    if (!tripInfos.isEmpty()) {
                        Map<String, Object> tripInfo = tripInfos.get(0);
                        if (tripInfo.get("bus_info") != null) busInfo = tripInfo.get("bus_info").toString();
                        if (tripInfo.get("dep_time") != null) depTime = tripInfo.get("dep_time").toString();
                    }
                } catch (Exception ignored) {}

                otpService.sendTicketEmail(
                    body.getOrDefault("passengerEmail", "").toString(),
                    body.getOrDefault("passengerName", "").toString(),
                    ref,
                    fromStop,
                    toStop,
                    travelDate,
                    depTime,
                    busInfo,
                    seatNo,
                    amount
                );

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "bookingRef", ref,
                    "message", "Seat " + seatNo + " booked successfully!"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Booking failed. Please try again."));
        }
    }

    /**
     * POST /api/agent/book/verify-otp
     * Verify OTP for cash booking → status changes from pending_otp → confirmed
     */
    @PostMapping("/book/verify-otp")
    public ResponseEntity<?> verifyCashBookingOtp(
            @RequestHeader("X-Agent-Token") String token,
            @RequestBody Map<String, String> body) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        String bookingRef = body.get("bookingRef");
        String otp = body.get("otp");

        if (otpService.verify("cash:" + bookingRef, otp)) {
            jdbc.update("UPDATE bookings SET status = 'confirmed' WHERE booking_ref = ? AND agent_id = ?",
                    bookingRef, agent.getId());
                    
            List<Map<String, Object>> bookings = jdbc.queryForList("""
                SELECT b.passenger_email, b.passenger_name, b.from_stop_name, b.to_stop_name, b.travel_date, b.seat_no, b.amount,
                       CONCAT(bs.code, ' (', bs.plate, ')') AS bus_info,
                       CONCAT(b.travel_date, ' ', TIME(COALESCE(st.departure_datetime, st.arrival_datetime))) AS dep_time
                FROM bookings b
                JOIN trips t ON t.id = b.trip_id
                JOIN buses bs ON bs.id = t.bus_id
                JOIN stop_times st ON st.trip_id = t.id
                JOIN stops s ON s.id = st.stop_id
                WHERE b.booking_ref = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(b.from_stop_name))
                LIMIT 1
            """, bookingRef);
            if (!bookings.isEmpty()) {
                Map<String, Object> b = bookings.get(0);
                otpService.sendTicketEmail(
                    b.get("passenger_email") != null ? b.get("passenger_email").toString() : "",
                    b.get("passenger_name") != null ? b.get("passenger_name").toString() : "",
                    bookingRef,
                    b.get("from_stop_name") != null ? b.get("from_stop_name").toString() : "",
                    b.get("to_stop_name") != null ? b.get("to_stop_name").toString() : "",
                    b.get("travel_date") != null ? b.get("travel_date").toString() : "",
                    b.get("dep_time") != null ? b.get("dep_time").toString() : "",
                    b.get("bus_info") != null ? b.get("bus_info").toString() : "",
                    b.get("seat_no") != null ? b.get("seat_no").toString() : "",
                    b.get("amount") != null ? ((Number) b.get("amount")).doubleValue() : 0.0
                );
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Cash booking confirmed!"));
        }
        return ResponseEntity.status(400).body(Map.of("error", "Invalid or expired OTP"));
    }

    // ══════════════════════════════════════════════════════════
    //  VIEW BOOKINGS FOR ASSIGNED BUS
    // ══════════════════════════════════════════════════════════

    @GetMapping("/bookings/{busId}")
    public ResponseEntity<?> getBusBookings(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable("busId") Long busId,
            @RequestParam(value = "date", required = false) String date) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        if (!isAgentBus(agent.getId(), busId)) {
            return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
        }

        try {
            String sql = """
                SELECT b.booking_ref, b.trip_id, b.seat_no, b.passenger_name, b.passenger_phone,
                       b.passenger_email, b.passenger_age, b.passenger_gender,
                       b.from_stop_name, b.to_stop_name, b.amount, b.status, b.travel_date,
                       b.payment_type, b.booked_at,
                       bs.code AS bus_code, bs.plate AS bus_plate,
                       CONCAT(b.travel_date, ' ', TIME(COALESCE(st_from.departure_datetime, st_from.arrival_datetime))) AS dep_time
                FROM bookings b
                JOIN trips t ON t.id = b.trip_id
                JOIN buses bs ON bs.id = t.bus_id
                LEFT JOIN stop_times st_from ON st_from.trip_id = t.id
                     AND st_from.stop_id IN (SELECT s.id FROM stops s WHERE TRIM(LOWER(s.name)) = TRIM(LOWER(b.from_stop_name)))
                WHERE t.bus_id = ? AND b.status IN ('confirmed', 'pending_otp')
                """ + (date != null && !date.isBlank() ? " AND DATE(b.travel_date) = ?" : "") +
                " ORDER BY b.booked_at DESC";

            List<Map<String, Object>> bookings = (date != null && !date.isBlank())
                ? jdbc.queryForList(sql, busId, date)
                : jdbc.queryForList(sql, busId);

            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch bookings"));
        }
    }

    // ══════════════════════════════════════════════════════════
    //  SEAT LAYOUT WITH PASSENGER DETAILS
    // ══════════════════════════════════════════════════════════

    @GetMapping("/layout/{tripId}")
    public ResponseEntity<?> getSeatLayout(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable("tripId") Long tripId,
            @RequestParam(value = "date", required = false) String date) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        try {
            // Check bus ownership
            Long busId = jdbc.queryForObject("SELECT bus_id FROM trips WHERE id = ?", Long.class, tripId);
            if (!isAgentBus(agent.getId(), busId)) {
                return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
            }

            // Get layout from seat_layouts table (same as BookingController)
            String layoutJson;
            int totalSeats = 40;
            try {
                Map<String, Object> layoutRow = jdbc.queryForMap(
                    "SELECT layout_json, total_seats FROM seat_layouts WHERE bus_id = ?", busId);
                layoutJson = layoutRow.get("layout_json") != null ? layoutRow.get("layout_json").toString() : null;
                totalSeats = layoutRow.get("total_seats") != null ? ((Number)layoutRow.get("total_seats")).intValue() : 40;
            } catch (Exception e) {
                // Generate default 2+2 layout (same as BookingController)
                layoutJson = generate2x2LayoutJson();
                jdbc.update(
                    "INSERT IGNORE INTO seat_layouts (bus_id, total_seats, layout_json) VALUES (?, 40, ?)",
                    busId, layoutJson);
            }

            // Get bookings with passenger details for this trip
            String bookingSql = """
                SELECT seat_no, passenger_name, passenger_phone, passenger_email,
                       passenger_age, passenger_gender, booking_ref, from_stop_name, to_stop_name,
                       amount, status, payment_type
                FROM bookings
                WHERE trip_id = ? AND status = 'confirmed'
                """ + (date != null && !date.isBlank() ? " AND travel_date = ?" : "");

            List<Map<String, Object>> bookings = (date != null && !date.isBlank())
                ? jdbc.queryForList(bookingSql, tripId, date)
                : jdbc.queryForList(bookingSql, tripId);

            // Build seat → passenger map
            Map<String, Map<String, Object>> seatDetails = new HashMap<>();
            for (Map<String, Object> b : bookings) {
                seatDetails.put(b.get("seat_no").toString(), b);
            }

            return ResponseEntity.ok(Map.of(
                "busId", busId,
                "tripId", tripId,
                "layoutJson", layoutJson != null ? layoutJson : "",
                "totalSeats", totalSeats,
                "bookedSeats", seatDetails
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load layout"));
        }
    }

    // ── Generate default 2x2 layout (matches BookingController) ──
    private String generate2x2LayoutJson() {
        StringBuilder sb = new StringBuilder("[");
        String[] cols = {"A", "B", "C", "D"};
        int seatNum = 0;
        for (int row = 0; row < 10; row++) {
            for (int col = 0; col < 4; col++) {
                if (seatNum > 0) sb.append(",");
                sb.append(String.format(
                    "{\"seatNo\":\"%s%d\",\"row\":%d,\"col\":%d,\"type\":\"%s\"}",
                    cols[col], row + 1, row, col, (col == 0 || col == 3) ? "window" : "aisle"
                ));
                seatNum++;
            }
        }
        sb.append("]");
        return sb.toString();
    }

    // ══════════════════════════════════════════════════════════
    //  CANCEL BOOKING
    // ══════════════════════════════════════════════════════════

    /**
     * Step 1: Request cancellation.
     * - If prepaid → OTP sent to passenger email
     * - If cash → directly cancel (no refund needed)
     */
    @PostMapping("/cancel/{bookingRef}")
    public ResponseEntity<?> requestCancel(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable("bookingRef") String bookingRef) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        try {
            Map<String, Object> booking = jdbc.queryForMap("""
                SELECT b.*, t.bus_id,
                       CONCAT(bs.code, ' (', bs.plate, ')') AS bus_info,
                       CONCAT(b.travel_date, ' ', TIME(COALESCE(st.departure_datetime, st.arrival_datetime))) AS dep_time
                FROM bookings b
                JOIN trips t ON t.id = b.trip_id
                JOIN buses bs ON bs.id = t.bus_id
                JOIN stop_times st ON st.trip_id = t.id
                JOIN stops s ON s.id = st.stop_id
                WHERE b.booking_ref = ? AND b.status = 'confirmed' AND TRIM(LOWER(s.name)) = TRIM(LOWER(b.from_stop_name))
                LIMIT 1
                """, bookingRef);

            Long busId = ((Number) booking.get("bus_id")).longValue();
            if (!isAgentBus(agent.getId(), busId)) {
                return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
            }

            String paymentType = booking.get("payment_type") != null ? booking.get("payment_type").toString() : "prepaid";

            if ("cash".equalsIgnoreCase(paymentType)) {
                // Cash booking → directly cancel
                jdbc.update("UPDATE bookings SET status = 'cancelled' WHERE booking_ref = ?", bookingRef);
                
                // Send cancellation email
                otpService.sendCancellationEmail(
                    booking.get("passenger_email") != null ? booking.get("passenger_email").toString() : "",
                    booking.get("passenger_name") != null ? booking.get("passenger_name").toString() : "",
                    bookingRef,
                    booking.get("from_stop_name") != null ? booking.get("from_stop_name").toString() : "",
                    booking.get("to_stop_name") != null ? booking.get("to_stop_name").toString() : "",
                    booking.get("travel_date") != null ? booking.get("travel_date").toString() : "",
                    booking.get("dep_time") != null ? booking.get("dep_time").toString() : "",
                    booking.get("bus_info") != null ? booking.get("bus_info").toString() : ""
                );

                return ResponseEntity.ok(Map.of("success", true, "message", "Cash booking cancelled"));
            } else {
                // Prepaid → send OTP to passenger email
                String passengerEmail = booking.get("passenger_email") != null ? booking.get("passenger_email").toString() : null;
                String passengerPhone = booking.get("passenger_phone") != null ? booking.get("passenger_phone").toString() : null;

                if (passengerEmail == null || passengerEmail.isBlank()) {
                    return ResponseEntity.status(400).body(Map.of("error", "No passenger email on record"));
                }

                otpService.generateAndSend("cancel:" + bookingRef, passengerEmail,
                    "Booking Cancellation OTP - Where is my Bus",
                    "A cancellation has been requested for your booking " + bookingRef + ".\nPassenger: " + booking.get("passenger_name") +
                    "\nPlease share this OTP with the agent to confirm cancellation.");

                return ResponseEntity.ok(Map.of(
                    "otpRequired", true,
                    "message", "OTP sent to passenger's email. Enter OTP to confirm cancellation."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "Booking not found or already cancelled"));
        }
    }

    /**
     * Step 2: Verify cancel OTP (for prepaid bookings)
     */
    @PostMapping("/cancel/{bookingRef}/verify-otp")
    public ResponseEntity<?> verifyCancelOtp(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable("bookingRef") String bookingRef,
            @RequestBody Map<String, String> body) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        String otp = body.get("otp");
        if (otpService.verify("cancel:" + bookingRef, otp)) {
            // Fetch details before cancelling status
            List<Map<String, Object>> bookings = jdbc.queryForList("""
                SELECT b.*,
                       CONCAT(bs.code, ' (', bs.plate, ')') AS bus_info,
                       CONCAT(b.travel_date, ' ', TIME(COALESCE(st.departure_datetime, st.arrival_datetime))) AS dep_time
                FROM bookings b
                JOIN trips t ON t.id = b.trip_id
                JOIN buses bs ON bs.id = t.bus_id
                JOIN stop_times st ON st.trip_id = t.id
                JOIN stops s ON s.id = st.stop_id
                WHERE b.booking_ref = ? AND TRIM(LOWER(s.name)) = TRIM(LOWER(b.from_stop_name))
                LIMIT 1
                """, bookingRef);
            if (!bookings.isEmpty()) {
                Map<String, Object> b = bookings.get(0);
                jdbc.update("UPDATE bookings SET status = 'cancelled' WHERE booking_ref = ?", bookingRef);
                
                otpService.sendCancellationEmail(
                    b.get("passenger_email") != null ? b.get("passenger_email").toString() : "",
                    b.get("passenger_name") != null ? b.get("passenger_name").toString() : "",
                    bookingRef,
                    b.get("from_stop_name") != null ? b.get("from_stop_name").toString() : "",
                    b.get("to_stop_name") != null ? b.get("to_stop_name").toString() : "",
                    b.get("travel_date") != null ? b.get("travel_date").toString() : "",
                    b.get("dep_time") != null ? b.get("dep_time").toString() : "",
                    b.get("bus_info") != null ? b.get("bus_info").toString() : ""
                );
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Booking cancelled successfully"));
        }
        return ResponseEntity.status(400).body(Map.of("error", "Invalid or expired OTP"));
    }

    // ══════════════════════════════════════════════════════════
    //  CREATE TRIP (for assigned bus only)
    // ══════════════════════════════════════════════════════════

    @PostMapping("/trips")
    public ResponseEntity<?> createTrip(
            @RequestHeader("X-Agent-Token") String token,
            @RequestBody Map<String, Object> body) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        try {
            Long busId = Long.valueOf(body.get("busId").toString());
            String departureTimeStr = body.get("departureTime").toString();

            if (!isAgentBus(agent.getId(), busId)) {
                return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
            }

            // Get route_id from bus
            Long routeId = jdbc.queryForObject("SELECT route_id FROM buses WHERE id = ?", Long.class, busId);

            // Insert trip
            jdbc.update(
                "INSERT INTO trips (route_id, bus_id, departure_datetime, status) VALUES (?, ?, ?, 'scheduled')",
                routeId, busId, departureTimeStr);

            Long tripId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            // Auto-generate stop_times
            List<Map<String, Object>> routeStops = jdbc.queryForList(
                "SELECT rs.stop_id, rs.seq, rs.offset_min FROM route_stops rs WHERE rs.route_id = ? ORDER BY rs.seq ASC",
                routeId);

            DateTimeFormatter fmt = new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM-dd'T'HH:mm")
                    .optionalStart().appendPattern(":ss").optionalEnd()
                    .toFormatter();
            LocalDateTime departure = LocalDateTime.parse(departureTimeStr, fmt);

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
                    tripId, stopId, seq, arrStr, depStr);
                i++;
            }

            return ResponseEntity.ok(Map.of(
                "tripId", tripId,
                "stopTimesCreated", routeStops.size(),
                "message", "Trip created successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create trip"));
        }
    }

    // ══════════════════════════════════════════════════════════
    //  MODIFY FARE (for assigned bus route only)
    // ══════════════════════════════════════════════════════════

    @PutMapping("/fare/{busId}")
    public ResponseEntity<?> updateFare(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable("busId") Long busId,
            @RequestBody Map<String, Object> body) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        if (!isAgentBus(agent.getId(), busId)) {
            return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
        }

        try {
            Long routeId = jdbc.queryForObject("SELECT route_id FROM buses WHERE id = ?", Long.class, busId);
            double newBasePrice = Double.parseDouble(body.get("basePrice").toString());

            // Update or insert route_pricing
            Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM route_pricing WHERE route_id = ?", Integer.class, routeId);
            if (existing != null && existing > 0) {
                jdbc.update("UPDATE route_pricing SET base_price = ? WHERE route_id = ?", newBasePrice, routeId);
            } else {
                jdbc.update("INSERT INTO route_pricing (route_id, base_price) VALUES (?, ?)", routeId, newBasePrice);
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Fare updated to ₹" + newBasePrice));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update fare"));
        }
    }

    // ══════════════════════════════════════════════════════════
    //  ASSIGN DRIVER (for assigned bus only)
    // ══════════════════════════════════════════════════════════

    @PutMapping("/driver/{busId}")
    public ResponseEntity<?> assignDriver(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable("busId") Long busId,
            @RequestBody Map<String, Object> body) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        if (!isAgentBus(agent.getId(), busId)) {
            return ResponseEntity.status(403).body(Map.of("error", "This bus is not assigned to you"));
        }

        try {
            Long driverId = Long.valueOf(body.get("driverId").toString());
            jdbc.update("UPDATE buses SET driver_id = ? WHERE id = ?", driverId, busId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Driver assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to assign driver"));
        }
    }

    // ══════════════════════════════════════════════════════════
    //  GET ALL DRIVERS (for dropdown)
    // ══════════════════════════════════════════════════════════

    @GetMapping("/drivers")
    public ResponseEntity<?> getAllDrivers(@RequestHeader("X-Agent-Token") String token) {
        Agent agent = getAgentFromToken(token);
        if (agent == null) return unauthorized();

        List<Map<String, Object>> drivers = jdbc.queryForList(
            "SELECT id, name, phone FROM drivers ORDER BY name");
        return ResponseEntity.ok(drivers);
    }

    // ══════════════════════════════════════════════════════════
    //  HELPER METHODS
    // ══════════════════════════════════════════════════════════

    private Agent getAgentFromToken(String token) {
        if (token == null || token.isBlank()) return null;
        Optional<Agent> agentOpt = agentRepo.findByAgentToken(token);
        if (agentOpt.isPresent()) {
            Agent agent = agentOpt.get();
            if (!agent.isTokenExpired() && agent.getActive()) {
                return agent;
            }
        }
        return null;
    }

    private boolean isAgentBus(Long agentId, Long busId) {
        try {
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM agent_bus_assignments WHERE agent_id = ? AND bus_id = ?",
                Integer.class, agentId, busId);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired agent token"));
    }

    private Integer parseAge(Map<String, Object> body) {
        try {
            if (body.containsKey("passengerAge") && body.get("passengerAge") != null
                    && !body.get("passengerAge").toString().isBlank()) {
                return Integer.valueOf(body.get("passengerAge").toString());
            }
        } catch (Exception ignored) {}
        return null;
    }

    private double calculateAmount(Long tripId, String fromStop, String toStop, String seatType) {
        try {
            String sql = """
                SELECT
                    COALESCE(rp.base_price, 500) AS basePrice,
                    COALESCE(rs_from.price_offset, 0) AS fromOffset,
                    COALESCE(rs_to.price_offset, 0) AS toOffset
                FROM trips t
                JOIN routes r ON r.id = t.route_id
                JOIN stops s_from ON TRIM(LOWER(s_from.name)) = TRIM(LOWER(?)) AND s_from.route_id = r.id
                JOIN stops s_to ON TRIM(LOWER(s_to.name)) = TRIM(LOWER(?)) AND s_to.route_id = r.id
                LEFT JOIN route_pricing rp ON rp.route_id = r.id
                LEFT JOIN route_stops rs_from ON rs_from.route_id = r.id AND rs_from.stop_id = s_from.id
                LEFT JOIN route_stops rs_to ON rs_to.route_id = r.id AND rs_to.stop_id = s_to.id
                WHERE t.id = ?
                LIMIT 1
                """;
            Map<String, Object> row = jdbc.queryForMap(sql, fromStop.trim(), toStop.trim(), tripId);
            double basePrice = ((Number) row.get("basePrice")).doubleValue();
            double fromOffset = ((Number) row.get("fromOffset")).doubleValue();
            double toOffset = ((Number) row.get("toOffset")).doubleValue();
            return toOffset > 0 ? Math.max(toOffset - fromOffset, 0) : basePrice;
        } catch (Exception e) {
            return 500;
        }
    }
}
