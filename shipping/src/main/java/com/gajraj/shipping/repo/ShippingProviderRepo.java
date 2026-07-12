package com.gajraj.shipping.repo;

import com.gajraj.shipping.model.ShippingProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ShippingProviderRepo extends JpaRepository<ShippingProviderConfig, UUID>, JpaSpecificationExecutor<ShippingProviderConfig> {
    boolean existsByProviderName(String providerName);
}
