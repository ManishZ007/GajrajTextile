package com.gajraj.order.service;

import com.gajraj.order.dto.CreateOrderRequestDTO;
import com.gajraj.order.dto.OrderListResponseDTO;
import com.gajraj.order.dto.OrderResponseDTO;
import com.gajraj.order.feign.ManagerServiceClient;
import com.gajraj.order.feign.ProductServiceClient;
import com.gajraj.order.model.Customization;
import com.gajraj.order.model.OrderItem;
import com.gajraj.order.model.Orders;
import com.gajraj.order.repo.OrdersRepo;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrdersService {

    private static final Logger log = LoggerFactory.getLogger(OrdersService.class);

    private final OrdersRepo ordersRepo;
    private final ProductServiceClient productServiceClient;
    private final ManagerServiceClient managerServiceClient;

    @org.springframework.beans.factory.annotation.Value("${service.internal-token}")
    private String internalToken;

    public OrdersService(OrdersRepo ordersRepo,
                         ProductServiceClient productServiceClient,
                         ManagerServiceClient managerServiceClient) {
        this.ordersRepo = ordersRepo;
        this.productServiceClient = productServiceClient;
        this.managerServiceClient = managerServiceClient;
    }


    @Transactional
    public OrderResponseDTO createOrder(CreateOrderRequestDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new RuntimeException("Order must have at least one item");
        }

        if ("COD".equalsIgnoreCase(dto.getPaymentMethod())) {
            java.math.BigDecimal total = java.math.BigDecimal.ZERO;
            for (var item : dto.getItems()) {
                if (!"READY_MADE".equals(item.getOrderType()) || item.getVariantId() == null || item.getQuantity() <= 0)
                    throw new IllegalArgumentException("COD requires ready-made items with valid variants and quantities");
                var quote = productServiceClient.quote(item.getVariantId(), internalToken);
                if (!Objects.equals(item.getProductId(), quote.get("productId").toString()))
                    throw new IllegalArgumentException("Variant does not belong to product");
                var price = new java.math.BigDecimal(quote.get("price").toString());
                if (price.signum() <= 0) throw new IllegalArgumentException("Invalid product price");
                item.setSubtotal(price.multiply(java.math.BigDecimal.valueOf(item.getQuantity())));
                total = total.add(item.getSubtotal());
            }
            if (total.compareTo(new java.math.BigDecimal("29000")) > 0)
                throw new IllegalArgumentException("COD is limited to Rs 29,000");
            dto.setTotalAmount(total);
        }

        String orderNumber = String.format("ORD-%d-%04d", LocalDate.now().getYear(), ordersRepo.count() + 1);

        Orders order = new Orders();
        order.setOrderNumber(orderNumber);
        order.setUserId(dto.getUserId());
        order.setAddressId(dto.getAddressId());
        order.setPaymentMethod(dto.getPaymentMethod());
        order.setTotalAmount(dto.getTotalAmount());

        Orders.OrderStatus initialStatus = "COD".equalsIgnoreCase(dto.getPaymentMethod())
                ? Orders.OrderStatus.CONFIRMED
                : Orders.OrderStatus.PENDING;
        order.setOrderStatus(initialStatus);

        List<OrderItem> items = dto.getItems().stream().map(itemDto -> {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(itemDto.getProductId());
            item.setVariantId(itemDto.getVariantId());
            item.setQuantity(itemDto.getQuantity());
            item.setSubtotal(itemDto.getSubtotal());
            item.setOrderType(itemDto.getOrderType());
            item.setCurrentStatus(OrderItem.ItemStatus.PENDING);
            return item;
        }).collect(Collectors.toList());

        order.setItems(items);
        Orders savedOrder = ordersRepo.save(order);

        reserveStock(savedOrder);
        if (initialStatus == Orders.OrderStatus.CONFIRMED) {
            productServiceClient.commit(savedOrder.getId(), internalToken);
        }
        if (initialStatus == Orders.OrderStatus.CONFIRMED) startFulfillment(savedOrder);

        return mapToResponseDTO(savedOrder);
    }


    @Transactional(readOnly = true)
    public OrderListResponseDTO getAllOrders(int page, int size, String status, String search, String userId) {
        return getAllOrders(page,size,status,search,userId,null);
    }
    @Transactional(readOnly = true)
    public OrderListResponseDTO getAllOrders(int page, int size, String status, String search, String userId, String orderType) {
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

            if (userId != null && !userId.isBlank()) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }

            if(orderType!=null && !orderType.isBlank()) {
                query.distinct(true);
                predicates.add(cb.equal(root.join("items").get("orderType"),orderType.toUpperCase(java.util.Locale.ROOT)));
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


    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersByUserId(String userId) {
        return ordersRepo.findByUserIdOrderByOrderDateDesc(userId, PageRequest.of(0, 100))
                .getContent().stream()
                .map(this::mapToResponseDTO)
                .toList();
    }


    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(UUID orderId) {
        Orders order = ordersRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        return mapToResponseDTO(order);
    }


    @Transactional
    public OrderResponseDTO cancelOrder(UUID orderId) {
        Orders order = ordersRepo.findForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getOrderStatus() == Orders.OrderStatus.CANCELLED) return mapToResponseDTO(order);
        if (Boolean.TRUE.equals(order.getShipmentStarted()) || Boolean.TRUE.equals(order.getCodCollected())
                || order.getItems().stream().anyMatch(i -> i.getTrackingNumber() != null || i.getCurrentStatus() == OrderItem.ItemStatus.SHIPPED || i.getCurrentStatus() == OrderItem.ItemStatus.DELIVERED))
            throw new IllegalStateException("Shipment has started; cancel shipment or use the returns process first");
        boolean cancellableCod = "COD".equalsIgnoreCase(order.getPaymentMethod())
                && order.getOrderStatus() == Orders.OrderStatus.CONFIRMED;
        if (order.getOrderStatus() != Orders.OrderStatus.PENDING && !cancellableCod)
            throw new IllegalStateException("Only pending or unshipped confirmed COD orders can be cancelled");
        if ("COD".equalsIgnoreCase(order.getPaymentMethod())) order.setIntegrationPending(true);

        order.setOrderStatus(Orders.OrderStatus.CANCELLED);
        synchronizeItemStatuses(order, Orders.OrderStatus.CANCELLED);

        if (Boolean.TRUE.equals(order.getReservationManaged())) {
            productServiceClient.cancel(orderId, internalToken);
            return mapToResponseDTO(ordersRepo.save(order));
        }
        for (OrderItem item : order.getItems()) {
            if (!Boolean.FALSE.equals(order.getStockDeducted())
                    && "READY_MADE".equals(item.getOrderType()) && item.getVariantId() != null) {
                try {
                    productServiceClient.incrementStock(item.getVariantId(), item.getQuantity());
                } catch (Exception e) {
                    log.warn("Failed to restock variant {} after cancellation: {}", item.getVariantId(), e.getMessage());
                }
            }
        }

        return mapToResponseDTO(ordersRepo.save(order));
    }


    @Transactional
    public OrderResponseDTO updateOrderStatusByManager(UUID orderId, String newStatus, String managerId) {
        if ("CANCELLED".equalsIgnoreCase(newStatus)) return cancelOrder(orderId);
        Orders order = ordersRepo.findForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        Orders.OrderStatus targetStatus;
        try {
            targetStatus = Orders.OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + newStatus);
        }
        if (targetStatus == order.getOrderStatus()) return mapToResponseDTO(order);
        Set<Orders.OrderStatus> allowed = switch (order.getOrderStatus()) {
            case CONFIRMED -> Set.of(Orders.OrderStatus.IN_PROGRESS, Orders.OrderStatus.ON_HOLD, Orders.OrderStatus.COMPLETED);
            case IN_PROGRESS -> Set.of(Orders.OrderStatus.ON_HOLD, Orders.OrderStatus.COMPLETED);
            case ON_HOLD -> Set.of(Orders.OrderStatus.IN_PROGRESS);
            default -> Set.of();
        };
        if (!allowed.contains(targetStatus)) throw new IllegalArgumentException("Invalid manager status transition from " + order.getOrderStatus() + " to " + targetStatus);
        ReadyMadeChecksService.guardStatusChange(order, targetStatus);
        order.setOrderStatus(targetStatus);
        synchronizeItemStatuses(order, targetStatus);
        if (managerId != null && !managerId.equals("anonymousUser")) {
            order.setHandledByManagerId(managerId);
        }
        return mapToResponseDTO(ordersRepo.save(order));
    }


    @Transactional
    public OrderResponseDTO takeOrder(UUID orderId, String managerId) {
        Orders order = ordersRepo.findForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getHandledByManagerId() != null) {
            throw new RuntimeException("Order already taken");
        }
        order.setHandledByManagerId(managerId);
        return mapToResponseDTO(ordersRepo.save(order));
    }


    @Transactional
    public OrderResponseDTO updateOrderStatus(UUID orderId, String newStatus) {
        if ("CANCELLED".equalsIgnoreCase(newStatus)) return cancelOrder(orderId);
        Orders order = ordersRepo.findForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Orders.OrderStatus targetStatus;
        try {
            targetStatus = Orders.OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + newStatus);
        }

        validateStatusTransition(order.getOrderStatus(), targetStatus);
        if (order.getOrderStatus() == Orders.OrderStatus.CANCELLED)
            throw new IllegalStateException("Cancelled orders cannot be reopened");
        ReadyMadeChecksService.guardStatusChange(order, targetStatus);
        order.setOrderStatus(targetStatus);
        synchronizeItemStatuses(order, targetStatus);

        String managerId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (managerId != null && !managerId.equals("anonymousUser")) {
            order.setHandledByManagerId(managerId);
        }

        return mapToResponseDTO(ordersRepo.save(order));
    }


    @Transactional
    public OrderResponseDTO updateOrderStatusInternal(UUID orderId, String newStatus) {
        if ("CANCELLED".equalsIgnoreCase(newStatus)) return cancelOrder(orderId);
        Orders order = ordersRepo.findForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        Orders.OrderStatus targetStatus;
        try {
            targetStatus = Orders.OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + newStatus);
        }

        if (order.getOrderStatus() == Orders.OrderStatus.CANCELLED)
            throw new IllegalStateException("Cancelled orders cannot be reopened");
        ReadyMadeChecksService.guardStatusChange(order, targetStatus);
        order.setOrderStatus(targetStatus);
        synchronizeItemStatuses(order, targetStatus);
        return mapToResponseDTO(ordersRepo.save(order));
    }


    @Transactional
    public OrderResponseDTO confirmPayment(UUID orderId) {
        Orders order = ordersRepo.findForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (order.getOrderStatus() == Orders.OrderStatus.CONFIRMED) {
            return mapToResponseDTO(order);
        }

        if (order.getOrderStatus() != Orders.OrderStatus.PENDING) {
            throw new RuntimeException("Payment can only be confirmed for PENDING orders");
        }

        if (Boolean.TRUE.equals(order.getReservationManaged())) {
            productServiceClient.commit(orderId, internalToken);
        } else {
            deductStock(order);
        }
        order.setOrderStatus(Orders.OrderStatus.CONFIRMED);
        startFulfillment(order);
        return mapToResponseDTO(ordersRepo.save(order));
    }


    private void deductStock(Orders order) {
        // Legacy orders already deducted stock at creation. Retrying confirmation
        // must not deduct twice; the caller holds the order's database lock.
        if (!Boolean.FALSE.equals(order.getStockDeducted())) return;
        List<OrderItem> deducted = new ArrayList<>();
        try {
            for (OrderItem item : order.getItems()) {
                if ("READY_MADE".equals(item.getOrderType()) && item.getVariantId() != null) {
                    if (item.getQuantity() <= 0) throw new IllegalArgumentException("Quantity must be positive");
                    productServiceClient.decrementStock(item.getVariantId(), item.getQuantity());
                    deducted.add(item);
                }
            }
            order.setStockDeducted(true);
        } catch (RuntimeException failure) {
            // Product writes use a separate database and need explicit compensation.
            for (OrderItem item : deducted) {
                try {
                    productServiceClient.incrementStock(item.getVariantId(), item.getQuantity());
                } catch (RuntimeException rollbackFailure) {
                    failure.addSuppressed(rollbackFailure);
                    log.error("Stock reconciliation required for order {}, variant {}",
                            order.getId(), item.getVariantId(), rollbackFailure);
                }
            }
            throw failure;
        }
    }

    private void startFulfillment(Orders order) {
        // Persist with the order transaction. A scheduled worker retries failed integrations.
        order.setIntegrationPending(true);
    }

    private Map<String,Object> reserveStock(Orders order) {
        Map<UUID,Integer> quantities = new TreeMap<>();
        for (OrderItem item : order.getItems()) {
            if (item.getQuantity() <= 0) throw new IllegalArgumentException("Quantity must be positive");
            if ("READY_MADE".equals(item.getOrderType())) {
                if (item.getVariantId() == null) throw new IllegalArgumentException("Variant is required");
                quantities.merge(UUID.fromString(item.getVariantId()), item.getQuantity(), Math::addExact);
            }
        }
        return productServiceClient.reserve(order.getId(), internalToken, quantities);
    }

    @Transactional
    public Map<String,Object> paymentReservation(UUID id, String userId) {
        Orders order = ordersRepo.findForUpdate(id).orElseThrow();
        if (!Objects.equals(order.getUserId(), userId)) throw new IllegalArgumentException("Order owner mismatch");
        if (order.getOrderStatus() != Orders.OrderStatus.PENDING) throw new IllegalStateException("Order is not pending");
        if (!Boolean.TRUE.equals(order.getReservationManaged())) throw new IllegalStateException("Start a new checkout for this legacy order");
        Map<String,Object> hold = reserveStock(order);
        return Map.of("amount", order.getTotalAmount(), "expiresAt", hold.get("expiresAt"));
    }

    @Transactional
    public void paymentFailed(UUID id) {
        Orders order = ordersRepo.findForUpdate(id).orElseThrow();
        if (order.getOrderStatus() != Orders.OrderStatus.PENDING) return;
        if (!Boolean.TRUE.equals(order.getReservationManaged())) return;
        productServiceClient.release(id, internalToken);
        order.setOrderStatus(Orders.OrderStatus.CANCELLED);
        synchronizeItemStatuses(order, Orders.OrderStatus.CANCELLED);
        ordersRepo.save(order);
    }

    private void synchronizeItemStatuses(Orders order, Orders.OrderStatus status) {
        OrderItem.ItemStatus target = switch (status) {
            case IN_PROGRESS -> OrderItem.ItemStatus.IN_PRODUCTION;
            case COMPLETED -> OrderItem.ItemStatus.COMPLETED;
            case DELIVERED -> OrderItem.ItemStatus.DELIVERED;
            case CANCELLED -> OrderItem.ItemStatus.CANCELLED;
            // Payment confirmation and a pause do not change fulfillment progress.
            default -> null;
        };
        if (target == null || order.getItems() == null) return;
        for (OrderItem item : order.getItems()) {
            // Parent production changes must not rewind shipped or delivered items.
            if (item.getCurrentStatus() == OrderItem.ItemStatus.DELIVERED) continue;
            if (item.getCurrentStatus() == OrderItem.ItemStatus.SHIPPED
                    && target != OrderItem.ItemStatus.DELIVERED) continue;
            if (item.getCurrentStatus() == OrderItem.ItemStatus.CANCELLED) continue;
            item.setCurrentStatus(target);
        }
    }

    private void validateStatusTransition(Orders.OrderStatus current, Orders.OrderStatus target) {
        Map<Orders.OrderStatus, Set<Orders.OrderStatus>> validTransitions = Map.of(
                Orders.OrderStatus.PENDING,   Set.of(Orders.OrderStatus.CONFIRMED, Orders.OrderStatus.CANCELLED),
                Orders.OrderStatus.CONFIRMED, Set.of(Orders.OrderStatus.CANCELLED),
                Orders.OrderStatus.CANCELLED, Set.of()
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
        dto.setAddressId(order.getAddressId());
        dto.setOrderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : null);
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setCodCollected(order.getCodCollected());
        dto.setIntegrationPending(order.getIntegrationPending());
        dto.setShipmentStarted(order.getShipmentStarted());
        dto.setReadyMadeQuality(order.getReadyMadeQuality() == null ? "PENDING" : order.getReadyMadeQuality());
        dto.setHoldReason(order.getHoldReason());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setHandledByManagerId(order.getHandledByManagerId());
        dto.setOrderDate(order.getOrderDate());
        dto.setUpdatedAt(order.getUpdatedAt());

        if (order.getItems() != null) {
            List<OrderResponseDTO.OrderItemDTO> itemDtos = order.getItems().stream().map(item -> {
                OrderResponseDTO.OrderItemDTO itemDto = new OrderResponseDTO.OrderItemDTO();
                itemDto.setOrderItemId(item.getId());
                itemDto.setProductId(item.getProductId());
                itemDto.setVariantId(item.getVariantId());
                itemDto.setQuantity(item.getQuantity());
                itemDto.setSubtotal(item.getSubtotal());
                itemDto.setOrderType(item.getOrderType());
                itemDto.setCurrentStatus(item.getCurrentStatus() != null ? item.getCurrentStatus().name() : null);
                itemDto.setTrackingNumber(item.getTrackingNumber());
                itemDto.setCourierService(item.getCourierService());
                itemDto.setEstimatedDelivery(item.getEstimatedDelivery());
                return itemDto;
            }).toList();
            dto.setItems(itemDtos);
        }

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
