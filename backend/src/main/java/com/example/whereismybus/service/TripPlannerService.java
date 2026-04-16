package com.example.whereismybus.service;

import com.example.whereismybus.dto.TripPlanDto;
import com.example.whereismybus.repo.JdbcTripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class TripPlannerService {
    private final JdbcTripRepository repo;

    public TripPlannerService(JdbcTripRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<TripPlanDto> findDirectTrips(Long fromStopId, Long toStopId, int limit) {
        List<Long> routeIds = repo.findRouteIdsForDirection(fromStopId, toStopId);
        if (routeIds == null || routeIds.isEmpty()) return new ArrayList<>();
        List<TripPlanDto> result = new ArrayList<>();
        for (Long routeId : routeIds) {
            List<TripPlanDto> rows = repo.findUpcomingTripsForRoute(routeId, fromStopId, toStopId, limit);
            result.addAll(rows);
        }
        return result;
    }
}