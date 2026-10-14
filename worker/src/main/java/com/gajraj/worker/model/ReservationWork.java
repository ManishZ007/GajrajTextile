package com.gajraj.worker.model;
import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.Instant;
@Entity @Data @Table(name="reservation_work")
public class ReservationWork {
    @Id private UUID orderId;
    @Version private Long revision;
    private UUID workerId;
    private String workerName;
    private String orderNumber;
    private String managerId;
    private String status="ASSIGNED";
    @Column(length=1000) private String note;
    private Instant assignedAt=Instant.now();
    private Instant updatedAt=Instant.now();
}
