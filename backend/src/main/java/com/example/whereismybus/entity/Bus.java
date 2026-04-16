package com.example.whereismybus.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "buses")
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    private String plate;

    @ManyToOne
    @JoinColumn(name = "route_id")
    @JsonIgnore   // 🔥 FIX: prevent loop / serialization issue
    private Route route;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;

    private Boolean active = true;

    // Getters & Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getPlate() { return plate; }
    public void setPlate(String plate) { this.plate = plate; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}