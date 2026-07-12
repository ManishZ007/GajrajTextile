package com.gajraj.worker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Table(name = "material_usage_for_order")
public class MaterialUsageForOrder {

    @Id
    @GeneratedValue()
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "worker_id")
    private String workerId;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "material_id")
    private String materialId;

    @Column(name = "reported_at")
    private LocalDateTime reportedAt;

    @Column(name = "assigned_material_by")
    private String assignedMaterialBy;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material")
    private Materials material;



}
