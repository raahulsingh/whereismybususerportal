package com.example.whereismybus.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bus_state")
public class BusState {
    @Id
    private Long id; // same as bus id

    @OneToOne
    @MapsId
    private Bus bus;

    @ManyToOne
    private Route route;

    @Column(precision=10, scale=7)
    private BigDecimal lat;

    @Column(precision=10, scale=7)
    private BigDecimal lng;

    @Column(precision=6, scale=2)
    private BigDecimal speedKmph;

    @Column(precision=6, scale=2)
    private BigDecimal headingDeg;

    @Column(name="nearest_stop_id")
    private Long nearestStopId;

    @Column(name="at_stop")
    private Boolean atStop;

    private Instant lastPingAt;

    // ✅ NEW: links this bus state to a specific trip
    // Only this trip will see live bus data — other trips on same route are unaffected
    @Column(name="active_trip_id")
    private Long activeTripId;

    // --- getters / setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public BigDecimal getLat() { return lat; }
    public void setLat(BigDecimal lat) { this.lat = lat; }

    public BigDecimal getLng() { return lng; }
    public void setLng(BigDecimal lng) { this.lng = lng; }

    public BigDecimal getSpeedKmph() { return speedKmph; }
    public void setSpeedKmph(BigDecimal speedKmph) { this.speedKmph = speedKmph; }

    public BigDecimal getHeadingDeg() { return headingDeg; }
    public void setHeadingDeg(BigDecimal headingDeg) { this.headingDeg = headingDeg; }

    public Instant getLastPingAt() { return lastPingAt; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }

    public Long getNearestStopId() { return nearestStopId; }
    public void setNearestStopId(Long nearestStopId) { this.nearestStopId = nearestStopId; }

    public Boolean getAtStop() { return atStop; }
    public void setAtStop(Boolean atStop) { this.atStop = atStop; }

    public Long getActiveTripId() { return activeTripId; }
    public void setActiveTripId(Long activeTripId) { this.activeTripId = activeTripId; }

    // backward-compatible alias
    public void setUpdatedAt(Instant t) { setLastPingAt(t); }
    public Instant getUpdatedAt() { return getLastPingAt(); }
}