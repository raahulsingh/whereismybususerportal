package com.example.whereismybus.dto;

public class EtaResp {
    private Long busId;
    private Long stopId;
    private long seconds;

    public EtaResp() {}
    public EtaResp(Long busId, Long stopId, long seconds) {
        this.busId = busId; this.stopId = stopId; this.seconds = seconds;
    }

    public Long getBusId() { return busId; }
    public Long getStopId() { return stopId; }
    public long getSeconds() { return seconds; }
}
