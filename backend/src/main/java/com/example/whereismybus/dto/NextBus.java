package com.example.whereismybus.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class NextBus {
    private Long busId;
    private String busCode;
    private Long routeId;
    private double distanceKmToSource;
    private int etaMinToSource;
    private Instant lastPingAt;

    public NextBus() {}

    public NextBus(Long busId, String busCode, Long routeId,
                   double distanceKmToSource, int etaMinToSource, Instant lastPingAt) {
        this.busId = busId;
        this.busCode = busCode;
        this.routeId = routeId;
        this.distanceKmToSource = distanceKmToSource;
        this.etaMinToSource = etaMinToSource;
        this.lastPingAt = lastPingAt;
    }

    public Long getBusId() { return busId; }
    public String getBusCode() { return busCode; }
    public Long getRouteId() { return routeId; }
    public double getDistanceKmToSource() { return distanceKmToSource; }
    public int getEtaMinToSource() { return etaMinToSource; }
    public Instant getLastPingAt() { return lastPingAt; }

    public void setBusId(Long busId) { this.busId = busId; }
    public void setBusCode(String busCode) { this.busCode = busCode; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }
    public void setDistanceKmToSource(double distanceKmToSource) { this.distanceKmToSource = distanceKmToSource; }
    public void setEtaMinToSource(int etaMinToSource) { this.etaMinToSource = etaMinToSource; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }
}
