package com.gajraj.order.service;

import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReadyMadeChecksService {
    private final OrdersRepo orders;
    private final OrderCheckEventRepo events;
    public ReadyMadeChecksService(OrdersRepo orders, OrderCheckEventRepo events) {
        this.orders = orders; this.events = events;
    }
    public static boolean isReadyMade(Orders order) {
        return order.getItems() != null && !order.getItems().isEmpty()
            && order.getItems().stream().allMatch(i -> "READY_MADE".equals(i.getOrderType()));
    }
    public static void guardStatusChange(Orders order, Orders.OrderStatus target) {
        if (!isReadyMade(order) || target == order.getOrderStatus()) return;
        if (target == Orders.OrderStatus.ON_HOLD || order.getOrderStatus() == Orders.OrderStatus.ON_HOLD)
            throw new IllegalStateException("Use the hold or release action with a reason");
        if (Set.of(Orders.OrderStatus.COMPLETED, Orders.OrderStatus.DELIVERED).contains(target)
            && !Boolean.TRUE.equals(order.getShipmentStarted()) && !"APPROVED".equals(order.getReadyMadeQuality()))
            throw new IllegalStateException("Pass the ready-made quality check first");
    }
    public static void guardShipping(Orders order) {
        if (order.getOrderStatus() == Orders.OrderStatus.ON_HOLD)
            throw new IllegalStateException("Release the order hold before shipping");
        // Existing shipments may retry their begin callback without a new inspection.
        if (isReadyMade(order) && !Boolean.TRUE.equals(order.getShipmentStarted())
            && !"APPROVED".equals(order.getReadyMadeQuality()))
            throw new IllegalStateException("Pass the ready-made quality check before shipping");
    }
    public record Row(UUID orderId, String orderNumber, Orders.OrderStatus orderStatus,
                      String quality, String holdReason, LocalDateTime orderDate) {}
    @Transactional(readOnly = true)
    public Page<Row> list(String view, String quality, int page) {
        if (!Set.of("holds", "quality").contains(view) || page < 0)
            throw new IllegalArgumentException("Invalid check list");
        if (quality != null && !Set.of("PENDING", "APPROVED", "REJECTED").contains(quality))
            throw new IllegalArgumentException("Invalid quality status");
        Specification<Orders> spec = (root, query, cb) -> {
            var anyItem = query.subquery(UUID.class);
            var item = anyItem.from(OrderItem.class);
            anyItem.select(item.get("id")).where(cb.equal(item.get("order"), root));
            var otherItem = query.subquery(UUID.class);
            var other = otherItem.from(OrderItem.class);
            otherItem.select(other.get("id")).where(cb.equal(other.get("order"), root),
                cb.or(cb.isNull(other.get("orderType")), cb.notEqual(other.get("orderType"), "READY_MADE")));
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.exists(anyItem)); predicates.add(cb.not(cb.exists(otherItem)));
            predicates.add(cb.or(cb.isNull(root.get("shipmentStarted")), cb.isFalse(root.get("shipmentStarted"))));
            if (view.equals("holds")) predicates.add(cb.equal(root.get("orderStatus"), Orders.OrderStatus.ON_HOLD));
            else predicates.add(root.get("orderStatus").in(Orders.OrderStatus.CONFIRMED, Orders.OrderStatus.IN_PROGRESS, Orders.OrderStatus.COMPLETED, Orders.OrderStatus.ON_HOLD));
            if (quality != null) predicates.add(cb.equal(cb.coalesce(root.<String>get("readyMadeQuality"), "PENDING"), quality));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return orders.findAll(spec, PageRequest.of(page, 20, Sort.by("orderDate").ascending().and(Sort.by("id"))))
            .map(o -> new Row(o.getId(), o.getOrderNumber(), o.getOrderStatus(),
                o.getReadyMadeQuality() == null ? "PENDING" : o.getReadyMadeQuality(), o.getHoldReason(), o.getOrderDate()));
    }
    @Transactional(readOnly = true)
    public Page<OrderCheckEvent> history(UUID id, int page) {
        if (page < 0) throw new IllegalArgumentException("Invalid page");
        return events.findByOrderIdOrderByCreatedAtDesc(id, PageRequest.of(page, 20));
    }
    @Transactional
    public void act(UUID id, String action, String note, String actor) {
        if (action == null || !Set.of("HOLD", "RELEASE", "APPROVE", "REJECT").contains(action))
            throw new IllegalArgumentException("Invalid check action");
        if (actor == null || actor.isBlank()) throw new IllegalArgumentException("A signed-in manager is required");
        note = note == null ? "" : note.trim();
        if (note.length() > 1000 || (!action.equals("APPROVE") && note.isEmpty()))
            throw new IllegalArgumentException("Enter a reason of 1 to 1000 characters");
        var order = orders.findForUpdate(id).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!isReadyMade(order)) throw new IllegalArgumentException("These checks are for ready-made customer orders only");
        if (Boolean.TRUE.equals(order.getShipmentStarted())) throw new IllegalStateException("Shipment has already started");
        var status = order.getOrderStatus();
        if (!Set.of(Orders.OrderStatus.CONFIRMED, Orders.OrderStatus.IN_PROGRESS, Orders.OrderStatus.COMPLETED, Orders.OrderStatus.ON_HOLD).contains(status))
            throw new IllegalStateException("Order is not eligible for dispatch checks");
        if (action.equals("RELEASE")) {
            if (status != Orders.OrderStatus.ON_HOLD) throw new IllegalStateException("Order is not on hold");
            order.setOrderStatus(order.getStatusBeforeHold() == null ? Orders.OrderStatus.CONFIRMED : order.getStatusBeforeHold());
            order.setStatusBeforeHold(null); order.setHoldReason(null);
            order.setReadyMadeQuality("PENDING");
        } else if (action.equals("HOLD")) {
            if (status == Orders.OrderStatus.ON_HOLD) throw new IllegalStateException("Order is already on hold");
            order.setStatusBeforeHold(status); order.setOrderStatus(Orders.OrderStatus.ON_HOLD);
            order.setHoldReason(note); order.setReadyMadeQuality("PENDING");
        } else {
            if (status == Orders.OrderStatus.ON_HOLD) throw new IllegalStateException("Release the hold before checking quality");
            order.setReadyMadeQuality(action.equals("APPROVE") ? "APPROVED" : "REJECTED");
        }
        if (order.getHandledByManagerId() == null) order.setHandledByManagerId(actor);
        orders.save(order);
        var event = new OrderCheckEvent(); event.setOrderId(id); event.setAction(action);
        event.setNote(note); event.setActor(actor); event.setCreatedAt(LocalDateTime.now()); events.save(event);
    }
}
