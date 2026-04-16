package com.example.whereismybus.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bus_locations")
public class BusLocation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Bus bus;

    @Column(nullable=false, precision=10, scale=7)
    private BigDecimal lat;

    @Column(nullable=false, precision=10, scale=7)
    private BigDecimal lng;

    @Column(precision=6, scale=2)
    private BigDecimal speedKmph;

    @Column(precision=6, scale=2)
    private BigDecimal headingDeg;

    @Column(nullable=false)
    private Instant createdAt = Instant.now();

    // getters / setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }

    public BigDecimal getLat() { return lat; }
    public void setLat(BigDecimal lat) { this.lat = lat; }

    public BigDecimal getLng() { return lng; }
    public void setLng(BigDecimal lng) { this.lng = lng; }

    public BigDecimal getSpeedKmph() { return speedKmph; }
    public void setSpeedKmph(BigDecimal speedKmph) { this.speedKmph = speedKmph; }

    public BigDecimal getHeadingDeg() { return headingDeg; }
    public void setHeadingDeg(BigDecimal headingDeg) { this.headingDeg = headingDeg; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
