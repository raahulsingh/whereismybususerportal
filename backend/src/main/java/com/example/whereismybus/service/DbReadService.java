package com.example.whereismybus.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DbReadService {

    @Autowired
    private JdbcTemplate jdbc;

    public List<Map<String, Object>> findAllStops() {
        String sql = "SELECT id, name FROM stops ORDER BY id";
        return jdbc.queryForList(sql);
    }
}