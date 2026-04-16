package com.example.whereismybus.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class LiveBusDTO {

    private Long busId;
    private String busCode;
    private String routeName;
    private BigDecimal lat;
    private BigDecimal lng;
    private BigDecimal speedKmph;
    private Instant lastPingAt;

    // Fields calculated by backend for proximity to stops
    private Long nearestStopId;
    private Boolean atStop;
    private Double _nearestDistanceKm; // For display/debug on frontend

    // ===== constructors =====

    public LiveBusDTO() {
    }

    public LiveBusDTO(Long busId, String busCode, String routeName,
                      BigDecimal lat, BigDecimal lng, BigDecimal speedKmph, Instant lastPingAt,
                      Long nearestStopId, Boolean atStop, Double _nearestDistanceKm) {
        this.busId = busId;
        this.busCode = busCode;
        this.routeName = routeName;
        this.lat = lat;
        this.lng = lng;
        this.speedKmph = speedKmph;
        this.lastPingAt = lastPingAt;
        this.nearestStopId = nearestStopId;
        this.atStop = atStop;
        this._nearestDistanceKm = _nearestDistanceKm;
    }

    // ===== getters =====

    public Long getBusId() { return busId; }
    public String getBusCode() { return busCode; }
    public String getRouteName() { return routeName; }
    public BigDecimal getLat() { return lat; }
    public BigDecimal getLng() { return lng; }
    public BigDecimal getSpeedKmph() { return speedKmph; }
    public Instant getLastPingAt() { return lastPingAt; }
    public Long getNearestStopId() { return nearestStopId; }
    public Boolean getAtStop() { return atStop; }
    public Double get_nearestDistanceKm() { return _nearestDistanceKm; }

    // ===== setters =====

    public void setBusId(Long busId) { this.busId = busId; }
    public void setBusCode(String busCode) { this.busCode = busCode; }
    public void setRouteName(String routeName) { this.routeName = routeName; }
    public void setLat(BigDecimal lat) { this.lat = lat; }
    public void setLng(BigDecimal lng) { this.lng = lng; }
    public void setSpeedKmph(BigDecimal speedKmph) { this.speedKmph = speedKmph; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }
    public void setNearestStopId(Long nearestStopId) { this.nearestStopId = nearestStopId; }
    public void setAtStop(Boolean atStop) { this.atStop = atStop; }

    // yahi method TrackingService me call ho raha hai
    public void set_nearestDistanceKm(Double _nearestDistanceKm) {
        this._nearestDistanceKm = _nearestDistanceKm;
    }
}
