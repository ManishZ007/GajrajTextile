package com.gajraj.payment.service;

import com.gajraj.payment.dto.CreateOrderRequest;
import com.gajraj.payment.dto.CreateOrderResponse;
import com.gajraj.payment.dto.VerifyPaymentRequest;
import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.feign.OrderServiceClient;
import com.gajraj.payment.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private final PaymentRepository paymentRepository;
    private final OrderServiceClient orderServiceClient;

    public PaymentService(PaymentRepository paymentRepository, OrderServiceClient orderServiceClient) {
        this.paymentRepository = paymentRepository;
        this.orderServiceClient = orderServiceClient;
    }

    public Map<String, Object> createOrder(CreateOrderRequest request) throws RazorpayException {
        if ("COD".equalsIgnoreCase(request.getPaymentMethod())) {
            PaymentRecord record = new PaymentRecord();
            record.setOrderId(request.getOrderId());
            record.setAmount(request.getAmount());
            record.setPaymentMethod("COD");
            record.setStatus(PaymentRecord.PaymentStatus.COD_PENDING);
            paymentRepository.save(record);

            return Map.of("message", "COD order recorded");
        }

        RazorpayClient client = new RazorpayClient(keyId, keySecret);

        JSONObject options = new JSONObject();
        options.put("amount", request.getAmount() * 100); // convert to paise
        options.put("currency", "INR");
        options.put("receipt", request.getOrderId());

        Order order = client.orders.create(options);

        PaymentRecord record = new PaymentRecord();
        record.setOrderId(request.getOrderId());
        record.setRazorpayOrderId(order.get("id"));
        record.setAmount(request.getAmount());
        record.setCurrency("INR");
        record.setPaymentMethod(request.getPaymentMethod());
        record.setStatus(PaymentRecord.PaymentStatus.INITIATED);
        paymentRepository.save(record);

        return Map.of(
                "razorpayOrderId", (String) order.get("id"),
                "keyId", keyId,
                "amount", request.getAmount() * 100
        );
    }

    public Map<String, Object> verifyPayment(VerifyPaymentRequest request) {
        try {
            String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
            String generated = hmacSha256(payload, keySecret);

            if (!generated.equals(request.getRazorpaySignature())) {
                paymentRepository.findByOrderId(request.getOrderId()).ifPresent(record -> {
                    record.setStatus(PaymentRecord.PaymentStatus.FAILED);
                    paymentRepository.save(record);
                });
                return null; // signals verification failure to controller
            }

            paymentRepository.findByOrderId(request.getOrderId()).ifPresent(record -> {
                record.setRazorpayPaymentId(request.getRazorpayPaymentId());
                record.setStatus(PaymentRecord.PaymentStatus.PAID);
                paymentRepository.save(record);
            });

            try {
                orderServiceClient.confirmOrder(request.getOrderId());
            } catch (Exception e) {
                log.warn("Failed to confirm order {} in Order Service: {}", request.getOrderId(), e.getMessage());
            }

            return Map.of("message", "Payment successful", "orderId", request.getOrderId());

        } catch (Exception e) {
            throw new RuntimeException("Payment verification error: " + e.getMessage(), e);
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
