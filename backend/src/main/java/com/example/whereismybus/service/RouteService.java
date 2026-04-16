package com.example.whereismybus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.sql.ResultSet;
import java.util.*;

/**
 * RouteService - provides route search and trip detail APIs.
 *
 * Fixes applied:
 *  - Bug 1: findRoutes() matches stops by NAME (String) instead of ID (Long).
 *  - Bug 4: stopsHaveLatLng cached at startup via @PostConstruct.
 *  - Warning fix: replaced deprecated query(String, Object[], RowMapper) with varargs form.
 *  - Direction fix: findRoutes() now checks that fromStop.seq < toStop.seq,
 *                   so reverse-direction searches return no results correctly.
 */
@Service
public class RouteService {

    @Autowired
    private JdbcTemplate jdbc;

    // Cached at startup — avoids INFORMATION_SCHEMA query on every getTripDetails() call
    private boolean stopsHaveLatLng = false;

    @PostConstruct
    void init() {
        try {
            Integer cnt = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stops' " +
                            "AND COLUMN_NAME IN ('lat','lng')",
                    Integer.class);
            stopsHaveLatLng = (cnt != null && cnt >= 2);
        } catch (Exception e) {
            stopsHaveLatLng = false;
        }
    }

    /**
     * Finds routes where fromStop appears BEFORE toStop in the trip sequence.
     * Parameters are stop NAMES (String) — backend resolves all matching stop rows.
     *
     * Direction fix: added seq comparison (fromSeq < toSeq) so that a search for
     * "Rishikesh → Dehradun" does NOT return a Dehradun→Rishikesh trip.
     *
     * @param fromName  origin stop name       (e.g. "Dehradun")
     * @param toName    destination stop name   (e.g. "Rishikesh")
     * @param when      reserved for time filtering (unused for now)
     */
    public List<Map<String, Object>> findRoutes(String fromName, String toName, String when) {
        // when = travel date (yyyy-MM-dd). If provided, project stop_times to that date.
        // We store stop_times with actual datetimes but trips recur daily,
        // so we match by TIME(stop_time) and show for the requested date.
        // If no date given, default to today.
        String targetDate = (when != null && !when.isBlank()) ? when : java.time.LocalDate.now().toString();

        String sql = """
                SELECT
                    t.id AS tripId,
                    r.name AS routeName,
                    b.code AS busCode,
                    t.departure_datetime AS departureTime,
                    CONCAT(?, ' ', TIME((SELECT COALESCE(st2.departure_datetime, st2.arrival_datetime)
                       FROM stop_times st2
                       JOIN stops sn2 ON sn2.id = st2.stop_id
                      WHERE st2.trip_id = t.id AND sn2.name = ?
                      LIMIT 1))) AS fromTime,
                    CONCAT(?, ' ', TIME((SELECT COALESCE(st3.arrival_datetime, st3.departure_datetime)
                       FROM stop_times st3
                       JOIN stops sn3 ON sn3.id = st3.stop_id
                      WHERE st3.trip_id = t.id AND sn3.name = ?
                      LIMIT 1))) AS toTime
                FROM trips t
                JOIN routes r ON r.id = t.route_id
                LEFT JOIN buses b ON b.id = t.bus_id
                WHERE EXISTS (
                    SELECT 1 FROM stop_times sf
                    JOIN stops snf ON snf.id = sf.stop_id
                    WHERE sf.trip_id = t.id AND snf.name = ?
                )
                AND EXISTS (
                    SELECT 1 FROM stop_times st
                    JOIN stops snt ON snt.id = st.stop_id
                    WHERE st.trip_id = t.id AND snt.name = ?
                )
                AND (
                    SELECT sf2.seq FROM stop_times sf2
                    JOIN stops snf2 ON snf2.id = sf2.stop_id
                    WHERE sf2.trip_id = t.id AND snf2.name = ?
                    LIMIT 1
                ) < (
                    SELECT st4.seq FROM stop_times st4
                    JOIN stops snt2 ON snt2.id = st4.stop_id
                    WHERE st4.trip_id = t.id AND snt2.name = ?
                    LIMIT 1
                )
                AND DATE(t.departure_datetime) = ?
                LIMIT 20
                """;

        List<java.util.Map<String, Object>> rows = jdbc.queryForList(sql,
                targetDate, fromName,   // fromTime: date + TIME(subquery)
                targetDate, toName,     // toTime: date + TIME(subquery)
                fromName, toName,       // EXISTS checks
                fromName, toName,       // seq comparison
                targetDate              // DATE(t.departure_datetime) = ?
        );

        // Attach targetDate to each row so frontend can use it for booking
        rows.forEach(row -> row.put("travelDate", targetDate));
        return rows;
    }

    /**
     * Returns full trip details for the given tripId:
     * {
     *   tripId, routeId, busId, busCode, routeName,
     *   stops: [{seq, stopId, stopName, arrivalTime, departureTime}, ...],
     *   busState: {busId, lat, lng, lastPingAt, ...} or null,
     *   currentStop: {seq, stopId, stopName} or null
     * }
     */
    public Map<String, Object> getTripDetails(Long tripId) {
        Map<String, Object> result = new HashMap<>();

        // 1) Trip header
        String headerSql = """
                SELECT t.id AS tripId,
                       t.route_id AS routeId,
                       t.bus_id AS busId,
                       b.code AS busCode,
                       r.name AS routeName,
                       t.departure_datetime AS departureTime
                FROM trips t
                LEFT JOIN routes r ON r.id = t.route_id
                LEFT JOIN buses b ON b.id = t.bus_id
                WHERE t.id = ?
                """;
        Map<String, Object> header;
        try {
            header = jdbc.queryForMap(headerSql, tripId);
        } catch (EmptyResultDataAccessException e) {
            return Map.of("error", "trip_not_found");
        }
        result.putAll(header);

        // 2) Ordered stops — use actual trip departure date, not today
        // This ensures stop times show correct date for the trip
        String tripDate;
        try {
            Object depObj = header.get("departureTime");
            if (depObj != null) {
                tripDate = depObj.toString().substring(0, 10); // "yyyy-MM-dd"
            } else {
                tripDate = java.time.LocalDate.now().toString();
            }
        } catch (Exception e) {
            tripDate = java.time.LocalDate.now().toString();
        }
        String stopsSql = """
                SELECT st.seq      AS seq,
                       st.stop_id  AS stopId,
                       s.name      AS stopName,
                       DATE_ADD(st.arrival_datetime, INTERVAL DATEDIFF(?, DATE(t.departure_datetime)) DAY) AS arrivalTime,
                       DATE_ADD(st.departure_datetime, INTERVAL DATEDIFF(?, DATE(t.departure_datetime)) DAY) AS departureTime
                FROM stop_times st
                JOIN trips t ON t.id = st.trip_id
                LEFT JOIN stops s ON s.id = st.stop_id
                WHERE st.trip_id = ?
                ORDER BY st.seq ASC
                """;
        List<Map<String, Object>> stops = jdbc.query(
                stopsSql,
                (ResultSet rs, int rowNum) -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("seq", rs.getInt("seq"));
                    m.put("stopId", rs.getLong("stopId"));
                    m.put("stopName", rs.getString("stopName"));
                    m.put("arrivalTime", rs.getString("arrivalTime"));
                    m.put("departureTime", rs.getString("departureTime"));
                    return m;
                },
                tripDate, tripDate, tripId
        );
        result.put("stops", stops);

        // 3) Live bus state — ONLY if active_trip_id matches this tripId
        //    Prevents bus position from one trip leaking into another trip
        Map<String, Object> busState = null;
        Object busIdObj = header.get("busId");
        if (busIdObj != null) {
            try {
                Long busId = ((Number) busIdObj).longValue();
                // Try to fetch with active_trip_id (new column)
                // Fallback: if column doesn't exist yet, use active_trip_date
                String stateSql;
                boolean hasTripIdColumn = false;
                try {
                    Integer colExists = jdbc.queryForObject(
                            "SELECT COUNT(*) FROM information_schema.COLUMNS " +
                                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bus_state' " +
                                    "AND COLUMN_NAME = 'active_trip_id'", Integer.class);
                    hasTripIdColumn = (colExists != null && colExists > 0);
                } catch (Exception ignored) {}

                if (hasTripIdColumn) {
                    stateSql = """
                        SELECT id AS busId, lat, lng, heading_deg AS headingDeg,
                               speed_kmph AS speedKmph, last_ping_at AS lastPingAt,
                               active_trip_id AS activeTripId
                        FROM bus_state WHERE id = ? LIMIT 1
                        """;
                } else {
                    // Fallback: use active_trip_date to match today's trips
                    stateSql = """
                        SELECT id AS busId, lat, lng, heading_deg AS headingDeg,
                               speed_kmph AS speedKmph, last_ping_at AS lastPingAt,
                               NULL AS activeTripId
                        FROM bus_state WHERE id = ? LIMIT 1
                        """;
                }

                Map<String, Object> rawState = jdbc.queryForMap(stateSql, busId);
                Object activeTripIdObj = rawState.get("activeTripId");

                if (activeTripIdObj != null) {
                    // Trip-specific: only use if matches THIS trip
                    Long activeTripId = ((Number) activeTripIdObj).longValue();
                    if (activeTripId.equals(tripId)) {
                        busState = rawState;
                    }
                } else if (!hasTripIdColumn) {
                    // Migration not done yet — use date-based matching as fallback
                    // Check if last_ping_at is from today
                    Object lastPingObj = rawState.get("lastPingAt");
                    if (lastPingObj != null) {
                        String pingDate = lastPingObj.toString().substring(0, 10);
                        String nextDate = java.time.LocalDate.parse(tripDate).plusDays(1).toString();
                        if (pingDate.equals(tripDate) || pingDate.equals(nextDate)) {
                            // Also verify this bus belongs to this trip
                            try {
                                Long tripBusId = jdbc.queryForObject(
                                        "SELECT bus_id FROM trips WHERE id = ?", Long.class, tripId);
                                if (tripBusId != null && tripBusId.equals(busId)) {
                                    busState = rawState;
                                }
                            } catch (Exception ignored2) {}
                        }
                    }
                }
            } catch (Exception ignored) {
                // no bus state — null is fine
            }
        }
        result.put("busState", busState);

        // 4) Best-effort currentStop (stopsHaveLatLng cached at startup)
        boolean hasRelRecentPing = false;
        if (busIdObj != null && busState == null) {
            try {
                Map<String, Object> latestAny = jdbc.queryForMap(
                    "SELECT last_ping_at FROM bus_state WHERE id = ?", busIdObj);
                Object lastPing = latestAny.get("last_ping_at");
                if (lastPing != null) {
                    long diffMs = System.currentTimeMillis() - java.sql.Timestamp.valueOf(lastPing.toString()).getTime();
                    if (diffMs < 24 * 3600 * 1000) hasRelRecentPing = true;
                }
            } catch (Exception ignored) {}
        }

        result.put("hasBusStateForOtherTrip", busState == null && busIdObj != null && hasRelRecentPing);

        Map<String, Object> currentStop = null;
        try {
            if (busState != null && stopsHaveLatLng
                    && busState.get("lat") != null && busState.get("lng") != null) {
                String nearestSql = """
                        SELECT st.seq AS seq, s.id AS stopId, s.name AS stopName,
                               s.lat AS lat, s.lng AS lng
                        FROM stop_times st
                        JOIN stops s ON s.id = st.stop_id
                        WHERE st.trip_id = ?
                        ORDER BY (POW(COALESCE(s.lat,0) - ?,2) + POW(COALESCE(s.lng,0) - ?,2)) ASC
                        LIMIT 1
                        """;
                currentStop = jdbc.queryForMap(nearestSql,
                        tripId,
                        ((Number) busState.get("lat")).doubleValue(),
                        ((Number) busState.get("lng")).doubleValue());
            } else if (busState != null && busState.get("lastPingAt") != null) {
                String timeClosestSql = """
                        SELECT st.seq AS seq, s.id AS stopId, s.name AS stopName,
                               CONCAT(CURDATE(), ' ', TIME(st.departure_datetime)) AS departureTime
                        FROM stop_times st
                        JOIN stops s ON s.id = st.stop_id
                        WHERE st.trip_id = ?
                        ORDER BY ABS(TIMESTAMPDIFF(SECOND, TIME(st.departure_datetime), TIME(?))) ASC
                        LIMIT 1
                        """;
                currentStop = jdbc.queryForMap(timeClosestSql, tripId, busState.get("lastPingAt"));
            } else {
                // Compare only TIME portion — stop_times may have old dates
                String nowTime = jdbc.queryForObject("SELECT TIME(NOW())", String.class);
                String nextByTimeSql = """
                        SELECT st.seq AS seq, s.id AS stopId, s.name AS stopName,
                               CONCAT(CURDATE(), ' ', TIME(st.departure_datetime)) AS departureTime
                        FROM stop_times st
                        JOIN stops s ON s.id = st.stop_id
                        WHERE st.trip_id = ?
                        ORDER BY ABS(TIMESTAMPDIFF(SECOND, TIME(st.departure_datetime), ?)) ASC
                        LIMIT 1
                        """;
                currentStop = jdbc.queryForMap(nextByTimeSql, tripId, nowTime);
            }
        } catch (EmptyResultDataAccessException ignored) {
            currentStop = null;
        } catch (Exception ignored) {
            currentStop = null;
        }
        result.put("currentStop", currentStop);

        return result;
    }
}