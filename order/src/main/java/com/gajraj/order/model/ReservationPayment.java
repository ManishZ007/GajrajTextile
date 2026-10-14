package com.gajraj.order.model;
import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Data @Table(name="reservation_payments")
public class ReservationPayment {
    @Id private UUID id;
    @Version private Long revision;
    @Column(nullable=false) private UUID reservationId;
    @Column(nullable=false, unique=true, length=100) private String reference;
    @Column(precision=12,scale=2) private BigDecimal claimedAmount;
    @Column(precision=12,scale=2) private BigDecimal verifiedAmount;
    private String status = "PENDING";
    private Instant submittedAt = Instant.now();
    private Instant reviewedAt;
    private String reviewedBy;
    @Column(length=1000) private String reviewNote;
    @JsonIgnore @Column(columnDefinition="bytea") private byte[] proof;
    private String proofType;
    private Instant receivedAt;
    private String source;
    public boolean isHasProof() { return proof != null && proof.length > 0; }
}
