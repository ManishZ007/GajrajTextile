package com.gajraj.product.repo;
import com.gajraj.product.model.CustomDesignRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.util.UUID;
public interface CustomDesignRequestRepo extends JpaRepository<CustomDesignRequest,UUID> {
    Page<CustomDesignRequest> findByUserIdOrderByCreatedAtDesc(String userId, Pageable page);
}
