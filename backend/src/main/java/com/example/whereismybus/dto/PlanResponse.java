package com.example.whereismybus.dto;

import java.util.List;

public class PlanResponse {
    private List<RouteOption> options;
    public PlanResponse() {}
    public PlanResponse(List<RouteOption> options) { this.options = options; }
    public List<RouteOption> getOptions() { return options; }
    public void setOptions(List<RouteOption> options) { this.options = options; }
}
