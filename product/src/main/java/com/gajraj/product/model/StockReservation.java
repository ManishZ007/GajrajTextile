package com.gajraj.product.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@Entity @Data
@Table(name = "stock_reservations")
public class StockReservation {
    @Id private UUID orderId;
    @Enumerated(EnumType.STRING) private State state;
    private Instant expiresAt;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "stock_reservation_items", joinColumns = @JoinColumn(name = "order_id"))
    @MapKeyColumn(name = "variant_id") @Column(name = "quantity")
    private Map<UUID, Integer> quantities = new TreeMap<>();
    public enum State { HELD, COMMITTED, RELEASED, EXPIRED }
}
