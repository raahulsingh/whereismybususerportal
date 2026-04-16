package com.example.whereismybus.repository;

import com.example.whereismybus.entity.AppRelease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppReleaseRepository extends JpaRepository<AppRelease, Long> {
    Optional<AppRelease> findTopByOrderByIdDesc();
}
