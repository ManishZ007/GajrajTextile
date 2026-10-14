package com.gajraj.product.service;

import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import java.time.Instant;
import java.util.*;
import static com.gajraj.product.model.StockReservation.State.*;

@Service
public class StockReservationService {
    private final StockReservationRepo reservations;
    private final ProductVariantsRepo variants;
    private final StockHistoryRepo history;
    private final long ttlSeconds;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    public StockReservationService(StockReservationRepo reservations, ProductVariantsRepo variants,
            StockHistoryRepo history, @Value("${stock.reservation.ttl-seconds:900}") long ttlSeconds, org.springframework.jdbc.core.JdbcTemplate jdbc) {
        this.reservations = reservations; this.variants = variants; this.history = history;
        this.ttlSeconds = ttlSeconds;
        this.jdbc = jdbc;
    }
    @Transactional
    public StockReservation reserve(UUID orderId, Map<UUID, Integer> quantities) {
        return reserveFor(orderId, quantities, ttlSeconds);
    }
    @Transactional
    public StockReservation reserveCustomer(UUID orderId, Map<UUID, Integer> quantities) {
        return reserveFor(orderId, quantities, 86400);
    }
    private StockReservation reserveFor(UUID orderId, Map<UUID, Integer> quantities, long seconds) {
        if (quantities == null || quantities.isEmpty() || quantities.values().stream().anyMatch(q -> q == null || q <= 0))
            throw new IllegalArgumentException("Positive quantities are required");
        // A row lock cannot serialize concurrent retries before the hold exists.
        jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            try (var statement = connection.prepareStatement("select pg_advisory_xact_lock(hashtext(?))")) {
                statement.setString(1,"stock-reservation:"+orderId); statement.execute();
            } return null;
        });
        StockReservation existing = reservations.lock(orderId).orElse(null);
        if (existing != null) {
            if (!existing.getQuantities().equals(quantities)) throw new IllegalStateException("Reservation items changed");
            if (existing.getState() != HELD || !existing.getExpiresAt().isAfter(Instant.now()))
                throw new IllegalStateException("Reservation ended. Start a new checkout.");
            return existing; // Retries never extend the hold or deduct again.
        }
        StockReservation reservation = new StockReservation();
        reservation.setOrderId(orderId);
        reservation.setState(HELD);
        reservation.setExpiresAt(Instant.now().plusSeconds(seconds));
        reservation.setQuantities(new TreeMap<>(quantities));
        reservations.saveAndFlush(reservation); // Unique order ID; races roll back the entire transaction.
        changeStock(reservation, -1, "Checkout reservation");
        return reservation;
    }
    @Transactional
    public void commit(UUID orderId) {
        StockReservation r = reservations.lock(orderId).orElseThrow();
        if (r.getState() == COMMITTED) return;
        if (r.getState() != HELD || (!Boolean.TRUE.equals(r.getReviewPending()) && !r.getExpiresAt().isAfter(Instant.now())))
            throw new IllegalStateException("Reservation expired/released; paid order requires reconciliation or refund");
        r.setState(COMMITTED); // Stock already deducted when held.
        reservations.save(r);
    }
    @Transactional
    public void release(UUID orderId, boolean expiredOnly) {
        StockReservation r = reservations.lock(orderId).orElse(null);
        if (r == null || r.getState() != HELD) return;
        if (expiredOnly && Boolean.TRUE.equals(r.getReviewPending())) return;
        if (expiredOnly && r.getExpiresAt().isAfter(Instant.now())) return;
        changeStock(r, 1, expiredOnly ? "Reservation expired" : "Payment failed/cancelled");
        r.setState(expiredOnly ? EXPIRED : RELEASED);
        reservations.save(r);
    }
    private void changeStock(StockReservation r, int direction, String reason) {
        // Consistent lock order prevents deadlocks for baskets with multiple variants.
        new TreeMap<>(r.getQuantities()).forEach((id, quantity) -> {
            ProductVariants v = variants.lockStock(id).orElseThrow();
            int before = v.getStockQuantity();
            if (direction < 0 && !"ACTIVE".equalsIgnoreCase(v.getStatus()))
                throw new IllegalStateException("Variant is unavailable");
            int after = Math.addExact(before, Math.multiplyExact(direction, quantity));
            if (after < 0) throw new IllegalStateException("Insufficient stock for " + id);
            v.setStockQuantity(after);
            if (after == 0) v.setStatus("OUT_OF_STOCK");
            else if ("OUT_OF_STOCK".equals(v.getStatus())) v.setStatus("ACTIVE");
            variants.save(v);
            StockHistory h = new StockHistory(); h.setVariant(v);
            h.setChangeType(direction < 0 ? StockHistory.ChangeType.ORDER_DECREMENT : StockHistory.ChangeType.ORDER_RESTOCK);
            h.setPreviousQuantity(before); h.setNewQuantity(after); h.setChangeAmount(after - before);
            h.setReason(reason + ": " + r.getOrderId()); h.setChangedBy("SYSTEM"); history.save(h);
        });
    }

    @Transactional(readOnly = true)
    public Map<String,Object> quote(UUID variantId) {
        ProductVariants variant = variants.findById(variantId).orElseThrow();
        if (!"ACTIVE".equalsIgnoreCase(variant.getStatus())) throw new IllegalStateException("Variant is unavailable");
        return Map.of("productId", variant.getProduct().getProductId(), "price", variant.getPrice(),
                "name", variant.getProduct().getName(), "variantLabel", String.valueOf(variant.getSku()),
                "availableStock", variant.getStockQuantity());
    }

    @Transactional
    public void review(UUID id, boolean pending) {
        var r = reservations.lock(id).orElseThrow();
        if (r.getState() == COMMITTED) return;
        if (!pending && (r.getState() == RELEASED || r.getState() == EXPIRED)) return;
        if (r.getState() != HELD || (pending && !Boolean.TRUE.equals(r.getReviewPending()) && !r.getExpiresAt().isAfter(Instant.now())))
            throw new IllegalStateException("Stock hold expired");
        r.setReviewPending(pending);
        reservations.save(r);
    }

    @Transactional
    public void cancel(UUID orderId) {
        StockReservation reservation = reservations.lock(orderId).orElseThrow();
        if (reservation.getState() != HELD && reservation.getState() != COMMITTED) return;
        changeStock(reservation, 1, "Order cancelled");
        reservation.setState(RELEASED);
        reservations.save(reservation);
    }
}
