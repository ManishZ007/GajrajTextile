package com.gajraj.order.service;

import com.gajraj.order.dto.dealer.*;
import com.gajraj.order.model.Dealer;
import com.gajraj.order.model.DealerOrder;
import com.gajraj.order.model.DealerOrderItem;
import com.gajraj.order.model.DealerPayment;
import com.gajraj.order.repo.DealerOrderRepo;
import com.gajraj.order.repo.DealerPaymentRepo;
import com.gajraj.order.repo.DealerRepo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class DealerOrderService {

    private final DealerOrderRepo dealerOrderRepo;
    private final DealerRepo dealerRepo;
    private final DealerPaymentRepo dealerPaymentRepo;
    private final DealerService dealerService;

    public DealerOrderService(DealerOrderRepo dealerOrderRepo,
                               DealerRepo dealerRepo,
                               DealerPaymentRepo dealerPaymentRepo,
                               DealerService dealerService) {
        this.dealerOrderRepo = dealerOrderRepo;
        this.dealerRepo = dealerRepo;
        this.dealerPaymentRepo = dealerPaymentRepo;
        this.dealerService = dealerService;
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public DealerOrderResponseDTO createOrder(DealerOrderRequestDTO dto, String managerId) {
        if (dto.getDealerId() == null)
            throw new IllegalArgumentException("dealerId is required");
        if (dto.getItems() == null || dto.getItems().isEmpty())
            throw new IllegalArgumentException("At least one item is required");

        Dealer dealer = dealerRepo.findById(dto.getDealerId())
                .orElseThrow(() -> new NoSuchElementException("Dealer not found: " + dto.getDealerId()));

        DealerOrder order = new DealerOrder();
        order.setDealer(dealer);
        order.setCreatedByManagerId(managerId);
        order.setNotes(dto.getNotes());
        order.setStatus(DealerOrder.DealerOrderStatus.DRAFT);
        order.setOrderNumber(generateOrderNumber());

        List<DealerOrderItem> items = dto.getItems().stream().map(i -> {
            DealerOrderItem item = new DealerOrderItem();
            item.setDealerOrder(order);
            item.setCategory(i.getCategory());
            item.setColor(i.getColor());
            item.setButtiName(i.getButtiName());
            item.setPadarName(i.getPadarName());
            item.setZariName(i.getZariName());
            item.setGondas(i.getGondas() != null ? i.getGondas() : false);
            item.setQuantity(i.getQuantity());
            item.setPricePerPiece(i.getPricePerPiece() != null ? i.getPricePerPiece() : BigDecimal.ZERO);
            item.setTotalPrice(item.getPricePerPiece().multiply(BigDecimal.valueOf(i.getQuantity())));
            return item;
        }).collect(Collectors.toList());

        order.setItems(items);
        order.setTotalAmount(items.stream()
                .map(DealerOrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        return toDTO(dealerOrderRepo.save(order));
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getAllOrders(int page, int size, String status, String managerId) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<DealerOrder> result;

        if (status != null && !status.isBlank()) {
            try {
                result = dealerOrderRepo.findByStatusOrderByCreatedAtDesc(
                        DealerOrder.DealerOrderStatus.valueOf(status.toUpperCase()), pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        } else if (managerId != null && !managerId.isBlank()) {
            result = dealerOrderRepo.findByCreatedByManagerIdOrderByCreatedAtDesc(managerId, pageable);
        } else {
            result = dealerOrderRepo.findAll(pageable);
        }

        return Map.of(
                "orders", result.getContent().stream().map(this::toDTO).collect(Collectors.toList()),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages(),
                "currentPage", page
        );
    }

    @Transactional(readOnly = true)
    public DealerOrderResponseDTO getOrderById(UUID orderId) {
        return toDTO(findOrThrow(orderId));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrdersByDealer(UUID dealerId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<DealerOrder> result = dealerOrderRepo.findByDealerIdOrderByCreatedAtDesc(dealerId, pageable);
        return Map.of(
                "orders", result.getContent().stream().map(this::toDTO).collect(Collectors.toList()),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    // ── Update order details ──────────────────────────────────────────────────

    @Transactional
    public DealerOrderResponseDTO updateOrder(UUID orderId, DealerOrderRequestDTO dto) {
        DealerOrder order = findOrThrow(orderId);

        if (order.getStatus() == DealerOrder.DealerOrderStatus.DELIVERED ||
                order.getStatus() == DealerOrder.DealerOrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update a " + order.getStatus() + " order");
        }

        if (dto.getNotes() != null) order.setNotes(dto.getNotes());

        if (dto.getDealerId() != null) {
            Dealer dealer = dealerRepo.findById(dto.getDealerId())
                    .orElseThrow(() -> new NoSuchElementException("Dealer not found: " + dto.getDealerId()));
            order.setDealer(dealer);
        }

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            order.getItems().clear();
            List<DealerOrderItem> newItems = dto.getItems().stream().map(i -> {
                DealerOrderItem item = new DealerOrderItem();
                item.setDealerOrder(order);
                item.setCategory(i.getCategory());
                item.setColor(i.getColor());
                item.setButtiName(i.getButtiName());
                item.setPadarName(i.getPadarName());
                item.setZariName(i.getZariName());
                item.setGondas(i.getGondas() != null ? i.getGondas() : false);
                item.setQuantity(i.getQuantity());
                item.setPricePerPiece(i.getPricePerPiece() != null ? i.getPricePerPiece() : BigDecimal.ZERO);
                item.setTotalPrice(item.getPricePerPiece().multiply(BigDecimal.valueOf(i.getQuantity())));
                return item;
            }).collect(Collectors.toList());
            order.getItems().addAll(newItems);
            order.setTotalAmount(newItems.stream()
                    .map(DealerOrderItem::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
        }

        return toDTO(dealerOrderRepo.save(order));
    }

    // ── Update status ─────────────────────────────────────────────────────────

    @Transactional
    public DealerOrderResponseDTO updateStatus(UUID orderId, String newStatus) {
        DealerOrder order = findOrThrow(orderId);
        try {
            order.setStatus(DealerOrder.DealerOrderStatus.valueOf(newStatus.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }
        return toDTO(dealerOrderRepo.save(order));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteOrder(UUID orderId) {
        DealerOrder order = findOrThrow(orderId);
        if (order.getStatus() != DealerOrder.DealerOrderStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT orders can be deleted");
        }
        dealerOrderRepo.delete(order);
    }

    // ── Payment ───────────────────────────────────────────────────────────────

    @Transactional
    public DealerOrderResponseDTO addPayment(UUID orderId, AddPaymentRequestDTO dto, String managerId) {
        DealerOrder order = findOrThrow(orderId);

        if (dto.getAmount() == null || dto.getAmount().compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Payment amount must be greater than zero");

        BigDecimal balance = order.getTotalAmount().subtract(order.getPaidAmount());
        if (dto.getAmount().compareTo(balance) > 0)
            throw new IllegalArgumentException("Payment amount exceeds balance due: " + balance);

        DealerPayment payment = new DealerPayment();
        payment.setDealerOrder(order);
        payment.setAmount(dto.getAmount());
        payment.setPaymentMode(dto.getPaymentMode());
        payment.setReferenceNumber(dto.getReferenceNumber());
        payment.setNote(dto.getNote());
        payment.setRecordedByManagerId(managerId);

        order.getPayments().add(payment);
        order.setPaidAmount(order.getPaidAmount().add(dto.getAmount()));

        return toDTO(dealerOrderRepo.save(order));
    }

    @Transactional
    public void deletePayment(UUID orderId, UUID paymentId) {
        DealerOrder order = findOrThrow(orderId);
        DealerPayment payment = dealerPaymentRepo.findById(paymentId)
                .orElseThrow(() -> new NoSuchElementException("Payment not found: " + paymentId));

        order.setPaidAmount(order.getPaidAmount().subtract(payment.getAmount()));
        order.getPayments().remove(payment);
        dealerPaymentRepo.delete(payment);
        dealerOrderRepo.save(order);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private DealerOrder findOrThrow(UUID id) {
        return dealerOrderRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dealer order not found: " + id));
    }

    private String generateOrderNumber() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        long count = dealerOrderRepo.count() + 1;
        return String.format("DO-%s-%04d", year, count);
    }

    private DealerOrderResponseDTO toDTO(DealerOrder o) {
        DealerOrderResponseDTO dto = new DealerOrderResponseDTO();
        dto.setDealerOrderId(o.getId());
        dto.setOrderNumber(o.getOrderNumber());
        dto.setDealer(dealerService.toDTO(o.getDealer()));
        dto.setCreatedByManagerId(o.getCreatedByManagerId());
        dto.setStatus(o.getStatus().name());
        dto.setTotalAmount(o.getTotalAmount());
        dto.setPaidAmount(o.getPaidAmount());
        dto.setBalanceAmount(o.getTotalAmount().subtract(o.getPaidAmount()));
        dto.setNotes(o.getNotes());
        dto.setCreatedAt(o.getCreatedAt());
        dto.setUpdatedAt(o.getUpdatedAt());

        dto.setItems(o.getItems().stream().map(i -> {
            DealerOrderItemDTO itemDTO = new DealerOrderItemDTO();
            itemDTO.setItemId(i.getId());
            itemDTO.setCategory(i.getCategory());
            itemDTO.setColor(i.getColor());
            itemDTO.setButtiName(i.getButtiName());
            itemDTO.setPadarName(i.getPadarName());
            itemDTO.setZariName(i.getZariName());
            itemDTO.setGondas(i.getGondas());
            itemDTO.setQuantity(i.getQuantity());
            itemDTO.setPricePerPiece(i.getPricePerPiece());
            itemDTO.setTotalPrice(i.getTotalPrice());
            return itemDTO;
        }).collect(Collectors.toList()));

        dto.setPayments(o.getPayments().stream().map(p -> {
            DealerPaymentDTO payDTO = new DealerPaymentDTO();
            payDTO.setPaymentId(p.getId());
            payDTO.setAmount(p.getAmount());
            payDTO.setPaymentMode(p.getPaymentMode());
            payDTO.setReferenceNumber(p.getReferenceNumber());
            payDTO.setNote(p.getNote());
            payDTO.setRecordedByManagerId(p.getRecordedByManagerId());
            payDTO.setPaidAt(p.getPaidAt());
            return payDTO;
        }).collect(Collectors.toList()));

        return dto;
    }
}
