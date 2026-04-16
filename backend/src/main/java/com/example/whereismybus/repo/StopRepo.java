package com.example.whereismybus.repo;

import com.example.whereismybus.entity.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StopRepo extends JpaRepository<Stop, Long> {

    List<Stop> findByRouteIdOrderBySeqAsc(Long routeId);
    List<Stop> findByRoute_IdOrderBySeqAsc(Long routeId);


    List<Stop> findByNameContainingIgnoreCase(String q);

    @Query("select s from Stop s where s.route.id = :routeId and s.seq between :a and :b order by s.seq asc")
    List<Stop> segment(@Param("routeId") Long routeId,
                       @Param("a") int a,
                       @Param("b") int b);

    Stop findFirstByRouteIdAndSeq(Long routeId, int seq);
}
