package com.gajraj.customer.repo;


import com.gajraj.customer.model.Addresses;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepo extends JpaRepository<Addresses, Long> {

    @Query("SELECT a FROM Addresses a WHERE a.customer.id = :customerId")
    List<Addresses> findAddressByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT a FROM Addresses a WHERE a.customer.id = :customerId AND a.isDefault = true")
    Optional<Addresses> findDefaultAddressByCustomerId(@Param("customerId") UUID customerId);

    long countByCustomerId(@Param("customerId") UUID customerId);
}
