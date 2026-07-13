package com.gajraj.shipping.service;

import com.gajraj.shipping.dto.*;
import com.gajraj.shipping.enums.ShipmentStatus;
import com.gajraj.shipping.model.Shipment;
import com.gajraj.shipping.model.ShipmentTracking;
import com.gajraj.shipping.model.ShippingProviderConfig;
import com.gajraj.shipping.provider.MockShippingProvider;
import com.gajraj.shipping.provider.ShippingProvider;
import com.gajraj.shipping.provider.model.ShipmentProviderRequest;
import com.gajraj.shipping.provider.model.ShipmentProviderResult;
import com.gajraj.shipping.repo.ShipmentRepo;
import com.gajraj.shipping.repo.ShipmentTrackingRepo;
import com.gajraj.shipping.repo.ShippingProviderRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ShippingService {

    private final ShippingProvider shippingProvider;
    private final MockShippingProvider mockShippingProvider;
    private final ShipmentRepo shipmentRepo;
    private final ShipmentTrackingRepo trackingRepo;
    private final ShippingProviderRepo providerRepo;

    public ShippingService(ShippingProvider shippingProvider,
                           MockShippingProvider mockShippingProvider,
                           ShipmentRepo shipmentRepo,
                           ShipmentTrackingRepo trackingRepo,
                           ShippingProviderRepo providerRepo) {
        this.shippingProvider = shippingProvider;
        this.mockShippingProvider = mockShippingProvider;
        this.shipmentRepo = shipmentRepo;
        this.trackingRepo = trackingRepo;
        this.providerRepo = providerRepo;
    }

    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request, String userId) {
        if (shipmentRepo.existsByOrderId(request.getOrderId())) {
            throw new RuntimeException("Shipment already exists for orderId: " + request.getOrderId());
        }

        ShipmentProviderRequest providerRequest = ShipmentProviderRequest.builder()
                .orderId(request.getOrderId())
                .userId(userId)
                .shipmentType(request.getShipmentType())
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .recipientAddress(request.getRecipientAddress())
                .recipientCity(request.getRecipientCity())
                .recipientState(request.getRecipientState())
                .recipientPincode(request.getRecipientPincode())
                .weightKg(request.getWeightKg())
                .build();

        ShipmentProviderResult result = shippingProvider.createShipment(providerRequest);

        Shipment shipment = new Shipment();
        shipment.setOrderId(request.getOrderId());
        shipment.setUserId(userId);
        shipment.setProvider(result.getProvider());
        shipment.setShipmentType(request.getShipmentType());
        shipment.setTrackingNumber(result.getTrackingNumber());
        shipment.setAwbNumber(result.getAwbNumber());
        shipment.setCourierName(result.getCourierName());
        shipment.setTrackingUrl(result.getTrackingUrl());
        shipment.setEstimatedDelivery(result.getEstimatedDelivery());
        shipment.setShipmentStatus(ShipmentStatus.CREATED);

        shipment = shipmentRepo.save(shipment);
        addTrackingEvent(shipment, ShipmentStatus.CREATED);

        ensureMockProviderExists();

        return toResponse(shipment);
    }

    @Transactional
    public ShipmentResponse advanceMockStatus(NextStatusRequest request) {
        Shipment shipment = findById(request.getShipmentId());

        ShipmentStatus current = shipment.getShipmentStatus();
        if (current == ShipmentStatus.DELIVERED) {
            throw new RuntimeException("Shipment is already delivered.");
        }
        if (current == ShipmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot advance a cancelled shipment.");
        }
        if (current == ShipmentStatus.RETURNED) {
            throw new RuntimeException("Cannot advance a returned shipment.");
        }

        ShipmentStatus next = mockShippingProvider.getNextStatus(current);
        if (next == null) {
            throw new RuntimeException("No next status available for: " + current);
        }

        shipment.setShipmentStatus(next);
        shipment = shipmentRepo.save(shipment);
        addTrackingEvent(shipment, next);

        return toResponse(shipment);
    }

    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentByOrderId(String orderId) {
        Shipment shipment = shipmentRepo.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND: Shipment not found for orderId: " + orderId));
        return toResponse(shipment);
    }

    @Transactional(readOnly = true)
    public TrackingResponse getTrackingInfo(String trackingNumber) {
        Shipment shipment = shipmentRepo.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new RuntimeException("NOT_FOUND: Shipment not found for trackingNumber: " + trackingNumber));

        List<ShipmentTracking> events = trackingRepo.findByShipment_IdOrderByEventTimeAsc(shipment.getId());

        List<TrackingEventResponse> timeline = events.stream()
                .map(this::toTrackingEventResponse)
                .toList();

        return new TrackingResponse(toResponse(shipment), timeline,
                shipment.getShipmentStatus().name(), shipment.getEstimatedDelivery());
    }

    @Transactional
    public ShipmentResponse cancelShipment(CancelShipmentRequest request, String userId) {
        Shipment shipment = findById(request.getShipmentId());

        if (!shipment.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to cancel this shipment.");
        }

        ShipmentStatus current = shipment.getShipmentStatus();
        if (current == ShipmentStatus.DELIVERED) {
            throw new RuntimeException("Cannot cancel a delivered shipment.");
        }
        if (current == ShipmentStatus.CANCELLED) {
            throw new RuntimeException("Shipment is already cancelled.");
        }
        if (current == ShipmentStatus.OUT_FOR_DELIVERY) {
            throw new RuntimeException("Cannot cancel a shipment that is out for delivery.");
        }

        shippingProvider.cancelShipment(shipment.getAwbNumber());

        shipment.setShipmentStatus(ShipmentStatus.CANCELLED);
        shipment = shipmentRepo.save(shipment);

        String reason = (request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason() : "Cancelled by customer.";

        ShipmentTracking event = new ShipmentTracking();
        event.setShipment(shipment);
        event.setStatus(ShipmentStatus.CANCELLED);
        event.setTitle("Shipment Cancelled");
        event.setDescription(reason);
        event.setLocation("N/A");
        event.setEventTime(LocalDateTime.now());
        trackingRepo.save(event);

        return toResponse(shipment);
    }

    private void addTrackingEvent(Shipment shipment, ShipmentStatus status) {
        String[] meta = mockShippingProvider.getStatusMeta(status);
        ShipmentTracking event = new ShipmentTracking();
        event.setShipment(shipment);
        event.setStatus(status);
        event.setTitle(meta[0]);
        event.setDescription(meta[1]);
        event.setLocation(meta[2]);
        event.setEventTime(LocalDateTime.now());
        trackingRepo.save(event);
    }

    private Shipment findById(String shipmentId) {
        try {
            UUID uuid = UUID.fromString(shipmentId);
            return shipmentRepo.findById(uuid)
                    .orElseThrow(() -> new RuntimeException("NOT_FOUND: Shipment not found with id: " + shipmentId));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("NOT_FOUND: Invalid shipment id: " + shipmentId);
        }
    }

    private void ensureMockProviderExists() {
        if (!providerRepo.existsByProviderName("MOCK")) {
            ShippingProviderConfig mock = new ShippingProviderConfig();
            mock.setProviderName("MOCK");
            mock.setActive(true);
            providerRepo.save(mock);
        }
    }

    private ShipmentResponse toResponse(Shipment s) {
        ShipmentResponse r = new ShipmentResponse();
        r.setShipmentId(s.getId());
        r.setOrderId(s.getOrderId());
        r.setUserId(s.getUserId());
        r.setProvider(s.getProvider().name());
        r.setShipmentType(s.getShipmentType().name());
        r.setTrackingNumber(s.getTrackingNumber());
        r.setAwbNumber(s.getAwbNumber());
        r.setCourierName(s.getCourierName());
        r.setTrackingUrl(s.getTrackingUrl());
        r.setEstimatedDelivery(s.getEstimatedDelivery());
        r.setShipmentStatus(s.getShipmentStatus().name());
        r.setCreatedAt(s.getCreatedAt());
        r.setUpdatedAt(s.getUpdatedAt());
        return r;
    }

    private TrackingEventResponse toTrackingEventResponse(ShipmentTracking t) {
        return new TrackingEventResponse(t.getId(), t.getStatus().name(),
                t.getTitle(), t.getDescription(), t.getLocation(), t.getEventTime());
    }
}
