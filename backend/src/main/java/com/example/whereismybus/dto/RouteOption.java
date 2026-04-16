package com.example.whereismybus.dto;

import java.util.List;

public class RouteOption {
    public Long routeId;
    public String routeName;
    public StopLite source;
    public StopLite destination;
    public List<NextBus> nextBuses;

    public RouteOption() {}

    public RouteOption(Long routeId, String routeName, StopLite source, StopLite destination, List<NextBus> nextBuses) {
        this.routeId = routeId;
        this.routeName = routeName;
        this.source = source;
        this.destination = destination;
        this.nextBuses = nextBuses;
    }

    public Long getRouteId() { return routeId; }
    public String getRouteName() { return routeName; }
    public StopLite getSource() { return source; }
    public StopLite getDestination() { return destination; }
    public List<NextBus> getNextBuses() { return nextBuses; }
}
