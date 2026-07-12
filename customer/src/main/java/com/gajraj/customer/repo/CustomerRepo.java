package com.gajraj.customer.repo;


import com.gajraj.customer.dto.CustomerDTO.CustomerProfileUpdateRequest;
import com.gajraj.customer.dto.CustomerDTO.CustomerUpdateInDataBase;
import com.gajraj.customer.model.Addresses;
import com.gajraj.customer.model.Customers;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerRepo extends JpaRepository<Customers, UUID> {

    @Query("SELECT c FROM Customers c WHERE LOWER(c.user_id) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Customers> searchByUserId(@Param("search") String search, Pageable pageable);

    @Modifying
    @Transactional
    @Query("""
    UPDATE Customers c
    SET 
        c.gender = COALESCE(:#{#req.gender}, c.gender),
        c.dateOfBirth = COALESCE(:#{#req.date_of_birth}, c.dateOfBirth),
        c.profileImageUrl = COALESCE(:#{#req.profile_image_url}, c.profileImageUrl),
        c.updatedAt = COALESCE(:#{#req.updatedAt}, c.updatedAt)
    WHERE c.id = :customer_id
    """)
    int updateCustomerProfileInfo(
            @Param("customer_id") UUID customer_id,
            @Param("req") CustomerUpdateInDataBase req
    );


  @Query("""
            SELECT c FROM Customers c WHERE c.user_id = :user_id
            """)
    Customers findCustomerByUserId(
            @Param("user_id") String user_id
    );


}
