package com.gajraj.payment.service;

import com.gajraj.payment.dto.CreateOrderRequest;
import com.gajraj.payment.dto.VerifyPaymentRequest;
import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.feign.OrderServiceClient;
import com.gajraj.payment.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${service.internal-token}") private String internalToken;
    private final PaymentGateway gateway;
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;
    private final PaymentRepository paymentRepository;
    private final OrderServiceClient orderServiceClient;

    public PaymentService(PaymentRepository paymentRepository, OrderServiceClient orderServiceClient, PaymentGateway gateway) {
        this.gateway = gateway;
        this.paymentRepository = paymentRepository;
        this.orderServiceClient = orderServiceClient;
    }

    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createOrder(CreateOrderRequest request) throws RazorpayException {
        if (request.getOrderId() == null || request.getOrderId().isBlank()
                || request.getAmount() == null || request.getAmount() <= 0) {
            throw new IllegalArgumentException("A valid orderId and positive amount are required");
        }
        if ("COD".equalsIgnoreCase(request.getPaymentMethod())) {
            throw new IllegalArgumentException("COD records are created by Order Service");
        }

        // Serialize gateway-order creation across app instances and HTTP retries.
        jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            try (var statement = connection.prepareStatement("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")) {
                statement.setString(1, request.getOrderId()); statement.execute();
            }
            return null;
        });
        String userId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Map<String,Object> reservation = orderServiceClient.reserve(request.getOrderId(), userId, internalToken);
        long amount = new java.math.BigDecimal(reservation.get("amount").toString()).longValueExact();
        PaymentRecord existing = paymentRepository.findFirstByOrderIdOrderByIdDesc(request.getOrderId()).orElse(null);
        if (existing != null) {
            if (!userId.equals(existing.getUserId())) throw new IllegalArgumentException("Order owner mismatch");
            return Map.of("razorpayOrderId",existing.getRazorpayOrderId(),"keyId",keyId,"amount",Math.multiplyExact(existing.getAmount(),100), "expiresAt",reservation.get("expiresAt"));
        }
        String gatewayOrderId = gateway.create(request.getOrderId(), Math.multiplyExact(amount,100));
        PaymentRecord record = new PaymentRecord();
        record.setOrderId(request.getOrderId());
        record.setRazorpayOrderId(gatewayOrderId);
        record.setUserId(userId);
        record.setReservationExpiresAt(java.time.LocalDateTime.ofInstant(java.time.Instant.parse(reservation.get("expiresAt").toString()),java.time.ZoneOffset.UTC));
        record.setAmount(amount);
        record.setCurrency("INR");
        record.setPaymentMethod(request.getPaymentMethod());
        record.setStatus(PaymentRecord.PaymentStatus.INITIATED);
        paymentRepository.save(record);

        return Map.of(
                "razorpayOrderId", gatewayOrderId,
                "keyId", keyId,
                "amount", Math.multiplyExact(amount,100), "expiresAt", reservation.get("expiresAt")
        );
    }

    public Map<String, Object> verifyPayment(VerifyPaymentRequest request) {
        try {
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String generated = hmacSha256(payload, keySecret);

            if (!generated.equals(request.getRazorpaySignature())) {
                return null;
            }

            PaymentRecord record = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Payment record not found"));

            if (record.getOrderId() == null || record.getOrderId().isBlank()) {
                throw new IllegalStateException("Payment is not linked to an order");
            }

            if (!reconcile(record.getRazorpayOrderId())) {
                throw new IllegalStateException("Payment has not been captured; confirmation is pending");
            }
            return Map.of("message", "Payment successful", "orderId", record.getOrderId());

        } catch (Exception e) {
            throw new RuntimeException("Payment verification error: " + e.getMessage(), e);
        }
    }

    public boolean reconcile(String razorpayOrderId) throws RazorpayException {
        PaymentRecord record = paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElseThrow();
        if (Boolean.TRUE.equals(record.getOrderConfirmed())) return true;
        var payments = gateway.payments(razorpayOrderId);
        var captured = payments.stream().filter(p -> "captured".equals(p.status())).findFirst();
        if (captured.isPresent()) {
            var p = captured.get();
            if (!razorpayOrderId.equals(p.orderId()) || !"INR".equals(p.currency())
                    || p.amount() != Math.multiplyExact(record.getAmount(), 100))
                throw new IllegalStateException("Payment amount/currency/order mismatch");
            record.setStatus(PaymentRecord.PaymentStatus.PAID);
            record.setRazorpayPaymentId(p.id());
            paymentRepository.save(record);
            // Expired holds cannot silently sell another customer's reserved stock.
            // If commit fails, PAID is retained for explicit reconciliation/refund.
            orderServiceClient.confirmOrder(record.getOrderId());
            record.setOrderConfirmed(true);
            paymentRepository.save(record);
            return true;
        }
        if (record.getStatus() == PaymentRecord.PaymentStatus.PAID) return false;
        boolean failed = !payments.isEmpty() && payments.stream().allMatch(p -> "failed".equals(p.status()));
        boolean expired = record.getReservationExpiresAt() != null &&
                record.getReservationExpiresAt().isBefore(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        if (failed || expired) {
            orderServiceClient.failed(record.getOrderId(), internalToken);
            record.setStatus(PaymentRecord.PaymentStatus.FAILED);
            paymentRepository.save(record);
        }
        return false;
    }

    public Map<String,Object> reportFailure(String razorpayOrderId) throws RazorpayException {
        PaymentRecord record = paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElseThrow();
        String userId = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        if (!userId.equals(record.getUserId())) throw new IllegalArgumentException("Order owner mismatch");
        if (reconcile(razorpayOrderId)) return Map.of("status","PAID","orderId",record.getOrderId());
        return Map.of("status",paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElseThrow().getStatus().name());
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
