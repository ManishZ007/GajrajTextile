package com.gajraj.order.controller;

import com.gajraj.order.model.Orders;
import com.gajraj.order.model.DealerOrder;
import com.gajraj.order.repo.OrdersRepo;
import com.gajraj.order.repo.DealerOrderRepo;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/manager/profile")
public class ManagerProfileController {
    private final OrdersRepo orders;
    private final DealerOrderRepo bulk;
    public ManagerProfileController(OrdersRepo orders, DealerOrderRepo bulk) { this.orders = orders; this.bulk = bulk; }
    public record Row(UUID id, String number, String status, BigDecimal amount, LocalDateTime date) {}
    public record Result(long customerOrders, long completedCustomerOrders, long bulkOrders, long completedBulkOrders,
                         List<Row> items, int totalPages, long totalElements) {}

    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public Result orders(Authentication authentication, @RequestParam(defaultValue="customer") String type,
                         @RequestParam(defaultValue="0") int page) {
        if (authentication == null || "anonymousUser".equals(authentication.getName()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (page < 0 || !(type.equals("customer") || type.equals("bulk")))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page or order type");
        String managerId = authentication.getName();
        var pageable = PageRequest.of(page, 10);
        var rows = type.equals("bulk")
            ? bulk.findByCreatedByManagerIdOrderByCreatedAtDesc(managerId, pageable)
                .map(o -> new Row(o.getId(), o.getOrderNumber(), o.getStatus().name(), o.getTotalAmount(), o.getCreatedAt()))
            : orders.findByHandledByManagerIdOrderByOrderDateDesc(managerId, pageable)
                .map(o -> new Row(o.getId(), o.getOrderNumber(), o.getOrderStatus().name(), o.getTotalAmount(), o.getOrderDate()));
        return new Result(orders.countByHandledByManagerId(managerId),
            orders.countByHandledByManagerIdAndOrderStatusIn(managerId, List.of(Orders.OrderStatus.COMPLETED, Orders.OrderStatus.DELIVERED)),
            bulk.countByCreatedByManagerId(managerId),
            bulk.countByCreatedByManagerIdAndStatus(managerId, DealerOrder.DealerOrderStatus.DELIVERED),
            rows.getContent(), rows.getTotalPages(), rows.getTotalElements());
    }
}
