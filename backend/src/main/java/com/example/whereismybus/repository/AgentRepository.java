package com.example.whereismybus.repository;

import com.example.whereismybus.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AgentRepository extends JpaRepository<Agent, Long> {
    Optional<Agent> findByEmail(String email);
    Optional<Agent> findByAgentToken(String agentToken);
}
