package com.gajraj.shipping.service;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;
import java.math.BigDecimal;
@Component
public class OrderShippingClient {
    private final RestClient client;
    public OrderShippingClient(@Value("${order.service.url:http://localhost:8083}") String url, @Value("${service.internal-token}") String token) {
        client=RestClient.builder().baseUrl(url).defaultHeader("X-Service-Token", token).build();
    }
    public record Terms(String paymentMethod, BigDecimal codAmount, String userId) {}
    public record Owner(String userId) {}
    public String owner(String id) { return client.get().uri("/orders/internal/shipping/{id}/owner", id).retrieve().body(Owner.class).userId(); }
    public void progress(com.gajraj.shipping.model.Shipment s) {
        client.post().uri("/orders/internal/shipping/{id}/progress", s.getOrderId()).body(java.util.Map.of(
            "status", s.getShipmentStatus().name(), "trackingNumber", s.getTrackingNumber(), "courier", s.getCourierName(),
            "estimatedDelivery", s.getEstimatedDelivery() == null ? "" : s.getEstimatedDelivery().toString())).retrieve().toBodilessEntity();
    }
    public Terms begin(String id) {return client.post().uri("/orders/internal/shipping/{id}/begin",id).retrieve().body(Terms.class);}
    public void collected(String id) {client.post().uri("/orders/internal/shipping/{id}/collected",id).retrieve().toBodilessEntity();}
    public void cancelled(String id) {client.post().uri("/orders/internal/shipping/{id}/cancelled",id).retrieve().toBodilessEntity();}
}
