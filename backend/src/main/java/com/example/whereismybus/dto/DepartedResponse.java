package com.example.whereismybus.dto;

import java.util.List;

public class DepartedResponse {
    private List<DepartedBus> departed;
    public DepartedResponse() {}
    public DepartedResponse(List<DepartedBus> departed) { this.departed = departed; }
    public List<DepartedBus> getDeparted() { return departed; }
    public void setDeparted(List<DepartedBus> departed) { this.departed = departed; }
}
