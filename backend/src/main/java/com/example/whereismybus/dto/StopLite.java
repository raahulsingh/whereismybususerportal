package com.example.whereismybus.dto;

import java.math.BigDecimal;

public class StopLite {
    public Long id;
    public String name;
    public int seq;
    public BigDecimal lat;
    public BigDecimal lng;

    public StopLite() {}
    public StopLite(Long id, String name, int seq, BigDecimal lat, BigDecimal lng) {
        this.id = id; this.name = name; this.seq = seq; this.lat = lat; this.lng = lng;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getSeq() { return seq; }
    public BigDecimal getLat() { return lat; }
    public BigDecimal getLng() { return lng; }
}
