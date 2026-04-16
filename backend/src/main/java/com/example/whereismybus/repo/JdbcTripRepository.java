package com.example.whereismybus.repo;

import com.example.whereismybus.dto.TripPlanDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class JdbcTripRepository {
    private final JdbcTemplate jdbc;

    public JdbcTripRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * 1) find route ids where from-stop occurs before to-stop on same route
     */
    public List<Long> findRouteIdsForDirection(long fromId, long toId) {
        String sql = "SELECT rs1.route_id " +
                "FROM route_stops rs1 " +
                "JOIN route_stops rs2 ON rs1.route_id = rs2.route_id " +
                "WHERE rs1.stop_id = ? AND rs2.stop_id = ? AND rs1.seq < rs2.seq";
        return jdbc.queryForList(sql, Long.class, fromId, toId);
    }

    /**
     * New: find direct trips (same trip visits both stops in correct order) and map to DTO
     * Use this for 'same-route' direct results.
     */
    public List<TripPlanDto> findDirectTrips(long fromId, long toId, int limit) {
        String sql = """
            SELECT t.id AS tripId,
                   b.code AS busCode,
                   b.plate AS busPlate,
                   st_from.departure_datetime AS departFrom,
                   st_to.arrival_datetime    AS arriveTo
            FROM stop_times st_from
            JOIN stop_times st_to
              ON st_from.trip_id = st_to.trip_id
            JOIN trips t ON t.id = st_from.trip_id
            JOIN buses b ON b.id = t.bus_id
            WHERE st_from.stop_id = ?
              AND st_to.stop_id   = ?
              AND st_from.seq < st_to.seq
              AND st_to.arrival_datetime > NOW()
            ORDER BY st_to.arrival_datetime
            LIMIT ?
            """;

        return jdbc.query(sql, new TripPlanRowMapper(), fromId, toId, limit);
    }

    /**
     * 2) Find upcoming trips on a specific route (keeps previous method if needed)
     * Note: parameter order matches placeholders: fromId, toId, routeId, limit
     */
    public List<TripPlanDto> findUpcomingTripsForRoute(long routeId, long fromId, long toId, int limit) {
        String sql = "SELECT t.id AS tripId, b.code AS busCode, b.plate AS busPlate, " +
                "       st_from.departure_datetime AS departFrom, st_to.arrival_datetime AS arriveTo " +
                "FROM trips t " +
                "JOIN buses b ON b.id = t.bus_id " +
                "JOIN stop_times st_from ON st_from.trip_id = t.id AND st_from.stop_id = ? " +
                "JOIN stop_times st_to   ON st_to.trip_id = t.id   AND st_to.stop_id   = ? " +
                "WHERE t.route_id = ? AND st_to.arrival_datetime > NOW() " +
                "ORDER BY st_to.arrival_datetime " +
                "LIMIT ?";
        return jdbc.query(sql, new TripPlanRowMapper(), fromId, toId, routeId, limit);
    }

    private static class TripPlanRowMapper implements RowMapper<TripPlanDto> {
        @Override
        public TripPlanDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Long tripId = rs.getLong("tripId");
            String code = rs.getString("busCode");
            String plate = rs.getString("busPlate");
            java.sql.Timestamp depTs = rs.getTimestamp("departFrom");
            java.sql.Timestamp arrTs = rs.getTimestamp("arriveTo");
            LocalDateTime departFrom = depTs == null ? null : depTs.toLocalDateTime();
            LocalDateTime arriveTo = arrTs == null ? null : arrTs.toLocalDateTime();
            return new TripPlanDto(tripId, code, plate, departFrom, arriveTo);
        }
    }
}
