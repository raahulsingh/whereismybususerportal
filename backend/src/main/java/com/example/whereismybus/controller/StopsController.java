package com.example.whereismybus.controller;

import com.example.whereismybus.service.DbReadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class StopsController {

    @Autowired
    private DbReadService db;

    @GetMapping("/stops")
    public ResponseEntity<List<Map<String, Object>>> getStops() {
        List<Map<String, Object>> stops = db.findAllStops();
        return ResponseEntity.ok(stops);
    }
}
