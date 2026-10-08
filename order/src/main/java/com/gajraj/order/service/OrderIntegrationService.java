package com.gajraj.order.service;

import com.gajraj.order.repo.OrdersRepo;
import com.gajraj.order.model.Orders;
import com.gajraj.order.feign.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import java.util.*;

@Service
public class OrderIntegrationService {
    private final OrdersRepo orders;
    private final PaymentServiceClient payments;
    private final ManagerServiceClient manager;
    private final String token;
    public OrderIntegrationService(OrdersRepo orders, PaymentServiceClient payments, ManagerServiceClient manager,
            @Value("${service.internal-token}") String token) {
        this.orders=orders; this.payments=payments; this.manager=manager; this.token=token;
    }
    @Transactional
    public void sync(UUID id) {
        Orders order = orders.findForUpdate(id).orElseThrow();
        if (!Boolean.TRUE.equals(order.getIntegrationPending())) return;
        boolean cancelled = order.getOrderStatus() == Orders.OrderStatus.CANCELLED;
        if ("COD".equalsIgnoreCase(order.getPaymentMethod())) {
            payments.sync(id.toString(), token, Map.of("amount", order.getTotalAmount(), "userId", order.getUserId(),
                "status", cancelled ? "CANCELLED" : Boolean.TRUE.equals(order.getCodCollected()) ? "PAID" : "COD_PENDING"));
        }
        if (!cancelled) {
            var body = new HashMap<String,String>();
            body.put("orderId", id.toString()); body.put("addressId", order.getAddressId());
            body.put("orderType", order.getItems().stream().anyMatch(i -> "CUSTOM".equals(i.getOrderType())) ? "CUSTOM" : "READY_MADE");
            var response = manager.createOrderFlow(body);
            if (response == null || !response.getStatusCode().is2xxSuccessful()) throw new IllegalStateException("Manager synchronization failed");
        }
        order.setIntegrationPending(false);
        orders.save(order);
    }
}
