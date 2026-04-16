package com.example.whereismybus.repo;

import com.example.whereismybus.entity.BusLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface BusLocationRepo extends JpaRepository<BusLocation, Long> {
    Optional<BusLocation> findTopByBusIdOrderByCreatedAtDesc(Long busId);
    List<BusLocation> findByBusIdInOrderByCreatedAtDesc(List<Long> busIds);
    List<BusLocation> findAllByOrderByCreatedAtDesc();
}
