package com.gajraj.order.service;

import com.gajraj.order.dto.OrderCreateRequestDTO;
import com.gajraj.order.dto.OrderListResponseDTO;
import com.gajraj.order.dto.OrderResponseDTO;
import com.gajraj.order.feign.ManagerServiceClient;
import com.gajraj.order.feign.ProductServiceClient;
import com.gajraj.order.model.Customization;
import com.gajraj.order.model.Orders;
import com.gajraj.order.repo.OrdersRepo;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class OrdersService {

    private static final Logger log = LoggerFactory.getLogger(OrdersService.class);

    private final OrdersRepo ordersRepo;
    private final ProductServiceClient productServiceClient;
    private final ManagerServiceClient managerServiceClient;

    public OrdersService(OrdersRepo ordersRepo,
                         ProductServiceClient productServiceClient,
                         ManagerServiceClient managerServiceClient) {
        this.ordersRepo = ordersRepo;
        this.productServiceClient = productServiceClient;
        this.managerServiceClient = managerServiceClient;
    }


    public OrderResponseDTO createOrder(OrderCreateRequestDTO dto) {
        String orderNumber = String.format("ORD-%d-%04d", LocalDate.now().getYear(), ordersRepo.count() + 1);

        Orders order = new Orders();
        order.setOrderNumber(orderNumber);
        order.setUserId(dto.getUserId());
        order.setProductId(dto.getProductId());
        order.setVariantId(dto.getVariantId());
        order.setAddressId(dto.getAddressId());
        order.setOrderType(dto.getOrderType());
        order.setTotalAmount(dto.getTotalAmount());
        order.setPaymentMethod(dto.getPaymentMethod());

        Orders.OrderStatus initialStatus = "COD".equalsIgnoreCase(dto.getPaymentMethod())
                ? Orders.OrderStatus.CONFIRMED
                : Orders.OrderStatus.PENDING;
        order.setOrderStatus(initialStatus);

        if ("CUSTOM".equals(dto.getOrderType()) && dto.getCustomization() != null) {
            Customization customization = new Customization();
            customization.setPadar(dto.getCustomization().getPadar());
            customization.setButti(dto.getCustomization().getButti());
            customization.setKinar(dto.getCustomization().getKinar());
            customization.setZari(dto.getCustomization().getZari());
            customization.setGond(dto.getCustomization().getGond());
            customization.setBaseColor(dto.getCustomization().getBaseColor());
            customization.setPreviewImageUrl(dto.getCustomization().getPreviewImageUrl());
            customization.setOrder(order);
            order.setCustomization(customization);
        }

        Orders savedOrder = ordersRepo.save(order);

        if ("READY_MADE".equals(dto.getOrderType()) && dto.getVariantId() != null) {
            try {
                productServiceClient.decrementStock(dto.getVariantId(), dto.getQuantity());
            } catch (Exception e) {
                ordersRepo.delete(savedOrder);
                throw new RuntimeException("Failed to reserve stock for variant: " + dto.getVariantId());
            }
        }

        try {
            Map<String, String> orderFlowRequest = new HashMap<>();
            orderFlowRequest.put("orderId", savedOrder.getId().toString());
            orderFlowRequest.put("addressId", dto.getAddressId());
            orderFlowRequest.put("orderType", dto.getOrderType());
            managerServiceClient.createOrderFlow(orderFlowRequest);
        } catch (Exception e) {
            log.warn("Failed to create order flow in Manager Service for order {}: {}", savedOrder.getId(), e.getMessage());
        }

        return mapToResponseDTO(savedOrder);
    }


    @Transactional(readOnly = true)
    public OrderListResponseDTO getAllOrders(int page, int size, String status, String search, String orderType, String userId) {
        Specification<Orders> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("orderStatus"), Orders.OrderStatus.valueOf(status.toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }

            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("orderNumber")), "%" + search.toLowerCase() + "%"));
            }

            if (orderType != null && !orderType.isBlank()) {
                predicates.add(cb.equal(root.get("orderType"), orderType));
            }

            if (userId != null && !userId.isBlank()) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Orders> pageResult = ordersRepo.findAll(
                spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "orderDate"))
        );

        List<OrderResponseDTO> content = pageResult.getContent().stream()
                .map(this::mapToResponseDTO)
                .toList();

        return new OrderListResponseDTO(content, pageResult.getTotalElements(), pageResult.getTotalPages(), page, size);
    }


    @Transactional(readOnly = true)
    public OrderListResponseDTO getMyOrders(String userId, int page, int size) {
        Page<Orders> pageResult = ordersRepo.findByUserIdOrderByOrderDateDesc(
                userId,
                PageRequest.of(page, size)
        );

        List<OrderResponseDTO> content = pageResult.getContent().stream()
                .map(this::mapToResponseDTO)
                .toList();

        return new OrderListResponseDTO(content, pageResult.getTotalElements(), pageResult.getTotalPages(), page, size);
    }


    public OrderResponseDTO getOrderById(UUID orderId) {
        Orders order = ordersRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return mapToResponseDTO(order);
    }


    public OrderResponseDTO cancelOrder(UUID orderId) {
        Orders order = ordersRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getOrderStatus() != Orders.OrderStatus.PENDING) {
            throw new RuntimeException("Only pending orders can be cancelled");
        }

        order.setOrderStatus(Orders.OrderStatus.CANCELLED);

        if ("READY_MADE".equals(order.getOrderType()) && order.getVariantId() != null) {
            try {
                productServiceClient.incrementStock(order.getVariantId(), 1);
            } catch (Exception e) {
                log.warn("Failed to restock variant {} after cancellation: {}", order.getVariantId(), e.getMessage());
            }
        }

        return mapToResponseDTO(ordersRepo.save(order));
    }


    public OrderResponseDTO updateOrderStatus(UUID orderId, String newStatus) {
        Orders order = ordersRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Orders.OrderStatus targetStatus;
        try {
            targetStatus = Orders.OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + newStatus);
        }

        validateStatusTransition(order.getOrderStatus(), targetStatus);
        order.setOrderStatus(targetStatus);
        return mapToResponseDTO(ordersRepo.save(order));
    }


    public OrderResponseDTO confirmPayment(UUID orderId) {
        Orders order = ordersRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getOrderStatus() != Orders.OrderStatus.PENDING) {
            throw new RuntimeException("Payment can only be confirmed for PENDING orders");
        }

        order.setOrderStatus(Orders.OrderStatus.CONFIRMED);
        return mapToResponseDTO(ordersRepo.save(order));
    }


    private void validateStatusTransition(Orders.OrderStatus current, Orders.OrderStatus target) {
        Map<Orders.OrderStatus, Set<Orders.OrderStatus>> validTransitions = Map.of(
                Orders.OrderStatus.PENDING,     Set.of(Orders.OrderStatus.CONFIRMED, Orders.OrderStatus.CANCELLED),
                Orders.OrderStatus.CONFIRMED,   Set.of(Orders.OrderStatus.IN_PROGRESS, Orders.OrderStatus.CANCELLED),
                Orders.OrderStatus.IN_PROGRESS, Set.of(Orders.OrderStatus.ON_HOLD, Orders.OrderStatus.COMPLETED, Orders.OrderStatus.CANCELLED),
                Orders.OrderStatus.ON_HOLD,     Set.of(Orders.OrderStatus.IN_PROGRESS, Orders.OrderStatus.CANCELLED),
                Orders.OrderStatus.COMPLETED,   Set.of(Orders.OrderStatus.DELIVERED),
                Orders.OrderStatus.DELIVERED,   Set.of(),
                Orders.OrderStatus.CANCELLED,   Set.of()
        );

        Set<Orders.OrderStatus> allowed = validTransitions.getOrDefault(current, Set.of());
        if (!allowed.contains(target)) {
            throw new RuntimeException("Invalid status transition from " + current + " to " + target);
        }
    }


    private OrderResponseDTO mapToResponseDTO(Orders order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setUserId(order.getUserId());
        dto.setProductId(order.getProductId());
        dto.setVariantId(order.getVariantId());
        dto.setAddressId(order.getAddressId());
        dto.setOrderType(order.getOrderType());
        dto.setOrderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : null);
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setOrderDate(order.getOrderDate());
        dto.setUpdatedAt(order.getUpdatedAt());

        if (order.getCustomization() != null) {
            Customization c = order.getCustomization();
            OrderResponseDTO.CustomizationDTO cDto = new OrderResponseDTO.CustomizationDTO();
            cDto.setPadar(c.getPadar());
            cDto.setButti(c.getButti());
            cDto.setKinar(c.getKinar());
            cDto.setZari(c.getZari());
            cDto.setGond(c.getGond());
            cDto.setBaseColor(c.getBaseColor());
            cDto.setPreviewImageUrl(c.getPreviewImageUrl());
            dto.setCustomization(cDto);
        }

        return dto;
    }
}
