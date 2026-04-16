package com.example.whereismybus.repo;

import com.example.whereismybus.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BusRepo extends JpaRepository<Bus, Long> {
    List<Bus> findByRouteIdAndActiveTrue(Long routeId);
}
