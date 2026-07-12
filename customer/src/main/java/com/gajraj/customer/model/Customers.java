package com.gajraj.customer.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name="customers")
public class Customers {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "customer_id", columnDefinition = "UUID")
    private UUID id;


    private String user_id;

    @Column(name = "profile_image_url")
    private String profileImageUrl;


    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;


    @Column(name = "gender")
    private String gender;


    // connection
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Addresses> addresses;


    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @CreationTimestamp
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", columnDefinition = "TIMESTAMP DEFAULT NOW()")
    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.now();



}
