package com.example.whereismybus.repo;
import com.example.whereismybus.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DriverRepo extends JpaRepository<Driver, Long> {}
