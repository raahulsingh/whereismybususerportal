package com.example.whereismybus.dto;

import java.math.BigDecimal;

public class BusLocationUpdateDto {
    private Long busId;
    private BigDecimal lat;
    private BigDecimal lng;
    private BigDecimal speedKmph;
    private BigDecimal headingDeg;
    private BigDecimal alt; // if you want altitude

    // getters + setters
    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }

    public BigDecimal getLat() { return lat; }
    public void setLat(BigDecimal lat) { this.lat = lat; }

    public BigDecimal getLng() { return lng; }
    public void setLng(BigDecimal lng) { this.lng = lng; }

    public BigDecimal getSpeedKmph() { return speedKmph; }
    public void setSpeedKmph(BigDecimal speedKmph) { this.speedKmph = speedKmph; }

    public BigDecimal getHeadingDeg() { return headingDeg; }
    public void setHeadingDeg(BigDecimal headingDeg) { this.headingDeg = headingDeg; }

    public BigDecimal getAlt() { return alt; }
    public void setAlt(BigDecimal alt) { this.alt = alt; }
}
