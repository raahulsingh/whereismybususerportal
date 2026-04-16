package com.example.whereismybus.controller;

import com.example.whereismybus.dto.DepartedResponse;
import com.example.whereismybus.dto.EtaResp;
import com.example.whereismybus.dto.LiveBusDTO;
import com.example.whereismybus.dto.PlanResponse;
import com.example.whereismybus.entity.Route;
import com.example.whereismybus.entity.Stop;
import com.example.whereismybus.repo.RouteRepo;
import com.example.whereismybus.repo.StopRepo;
import com.example.whereismybus.service.TrackingService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class PublicController {
    private final TrackingService service;
    private final StopRepo stopRepo;
    private final RouteRepo routeRepo;

    public PublicController(TrackingService service, StopRepo stopRepo, RouteRepo routeRepo) {
        this.service = service; this.stopRepo = stopRepo; this.routeRepo = routeRepo;
    }
    // SEARCH STOPS by name (for auto-complete)
    @GetMapping("/stops/search")
    public List<Stop> searchStops(@RequestParam("q") String q) {
        return stopRepo.findByNameContainingIgnoreCase(q);
    }

    // PLAN: src -> dst (same route for MVP)
    @GetMapping("/plan")
    public PlanResponse plan(@RequestParam(name="srcId") Long srcId, @RequestParam(name="dstId") Long dstId) {
        return service.plan(srcId, dstId);
    }

    // JUST-DEPARTED from source (within 5–7 mins window)
    @GetMapping("/departed")
    public DepartedResponse departed(@RequestParam(name="srcId") Long srcId, @RequestParam(name="dstId") Long dstId) {
        return service.departed(srcId, dstId);
    }

    @GetMapping("/routes")
    public List<Route> routes(){ return routeRepo.findAll(); }

    @GetMapping("/routes/{routeId}/stops")
    public List<Stop> stops(@PathVariable("routeId") Long routeId){ return stopRepo.findByRouteIdOrderBySeqAsc(routeId); }

    @GetMapping("/buses/live")
    public List<LiveBusDTO> live(@RequestParam(name="routeId", required=false) Long routeId){
        return service.getLiveBuses(routeId);
    }

    @GetMapping("/eta")
    public EtaResp eta(@RequestParam(name="busId") Long busId, @RequestParam(name="stopId") Long stopId){
        return service.estimateEta(busId, stopId);
    }
}
