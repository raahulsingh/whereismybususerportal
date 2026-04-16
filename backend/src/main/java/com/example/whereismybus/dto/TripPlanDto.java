package com.example.whereismybus.dto;

import java.time.LocalDateTime;

public class TripPlanDto {
    private Long tripId;
    private String busCode;
    private String busPlate;
    private LocalDateTime departFrom;
    private LocalDateTime arriveTo;

    public TripPlanDto() {}

    public TripPlanDto(Long tripId, String busCode, String busPlate,
                       LocalDateTime departFrom, LocalDateTime arriveTo) {
        this.tripId = tripId;
        this.busCode = busCode;
        this.busPlate = busPlate;
        this.departFrom = departFrom;
        this.arriveTo = arriveTo;
    }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getBusCode() { return busCode; }
    public void setBusCode(String busCode) { this.busCode = busCode; }

    public String getBusPlate() { return busPlate; }
    public void setBusPlate(String busPlate) { this.busPlate = busPlate; }

    public LocalDateTime getDepartFrom() { return departFrom; }
    public void setDepartFrom(LocalDateTime departFrom) { this.departFrom = departFrom; }

    public LocalDateTime getArriveTo() { return arriveTo; }
    public void setArriveTo(LocalDateTime arriveTo) { this.arriveTo = arriveTo; }
}

