package com.gajraj.order.repo;

import com.gajraj.order.model.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DealerRepo extends JpaRepository<Dealer, UUID> {
    List<Dealer> findByNameContainingIgnoreCase(String name);
    List<Dealer> findByPhoneContaining(String phone);
    long countByCreatedByManagerId(String managerId);

    List<Dealer> findByCreatedByManagerId(String managerId);
}
