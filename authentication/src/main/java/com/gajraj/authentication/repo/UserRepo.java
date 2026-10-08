package com.gajraj.authentication.repo;


import com.gajraj.authentication.dto.update_user.updateUser.UpdateUserInfoDTO;
import com.gajraj.authentication.model.Users;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepo extends JpaRepository<Users, UUID> {

    Users findByEmail(String email);

    Users findByPhoneNumber(String phoneNumber);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Users u where u.user_id = :id")
    java.util.Optional<Users> findForOtpLogin(@Param("id") UUID id);

    List<Users> findByRoleOrderByCreatedAtDesc(Users.Role role);

    Users findByAuthProviderAndProviderUserId(Users.AuthProvider authProvider, String providerUserId);


    @Modifying
    @Transactional
    @Query("""
    UPDATE Users u 
    SET 
        u.fullName = COALESCE(:#{#req.full_name}, u.fullName), 
        u.email = COALESCE(:#{#req.email}, u.email), 
        u.phoneNumber = COALESCE(:#{#req.phone_number}, u.phoneNumber),
        u.updatedAt = COALESCE(:#{#req.updatedAt}, u.updatedAt)
    WHERE u.user_id = :userId
    """)
    int updateUserData(@Param("userId") UUID userId, @Param("req") UpdateUserInfoDTO req);


}