package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "dealer_order_items")
public class DealerOrderItem {

    @Id
    @GeneratedValue
    @Column(name = "item_id", columnDefinition = "UUID")
    private UUID id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dealer_order_id", nullable = false)
    private DealerOrder dealerOrder;

    @Column(name = "category")
    private String category;

    @Column(name = "color")
    private String color;

    @Column(name = "butti_name")
    private String buttiName;

    @Column(name = "padar_name")
    private String padarName;

    @Column(name = "zari_name")
    private String zariName;

    @Column(name = "gondas")
    private Boolean gondas = false;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "price_per_piece", precision = 10, scale = 2)
    private BigDecimal pricePerPiece;

    @Column(name = "total_price", precision = 10, scale = 2)
    private BigDecimal totalPrice;
}
