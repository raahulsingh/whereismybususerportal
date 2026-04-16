package com.example.whereismybus.repo;

import com.example.whereismybus.entity.BusState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface BusStateRepo extends JpaRepository<BusState, Long> {
    @Query("SELECT s FROM BusState s WHERE s.route.id = :routeId AND s.lastPingAt >= :since ORDER BY s.lastPingAt DESC")
    List<BusState> liveSince(@Param("routeId") Long routeId, @Param("since") Instant since);
}
