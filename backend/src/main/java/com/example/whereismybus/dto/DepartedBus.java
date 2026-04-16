package com.example.whereismybus.dto;

import java.time.Instant;

public class DepartedBus {
    private Long busId;
    private String busCode;
    private Long routeId;
    private Instant lastPingAt;
    private int minutesAgo;
    private int etaMinToDestination;

    public DepartedBus() {}

    public DepartedBus(Long busId, String busCode, Long routeId, Instant lastPingAt,
                       int minutesAgo, int etaMinToDestination) {
        this.busId = busId;
        this.busCode = busCode;
        this.routeId = routeId;
        this.lastPingAt = lastPingAt;
        this.minutesAgo = minutesAgo;
        this.etaMinToDestination = etaMinToDestination;
    }

    public Long getBusId() { return busId; }
    public String getBusCode() { return busCode; }
    public Long getRouteId() { return routeId; }
    public Instant getLastPingAt() { return lastPingAt; }
    public int getMinutesAgo() { return minutesAgo; }
    public int getEtaMinToDestination() { return etaMinToDestination; }

    public void setBusId(Long busId) { this.busId = busId; }
    public void setBusCode(String busCode) { this.busCode = busCode; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }
    public void setMinutesAgo(int minutesAgo) { this.minutesAgo = minutesAgo; }
    public void setEtaMinToDestination(int etaMinToDestination) { this.etaMinToDestination = etaMinToDestination; }
}
