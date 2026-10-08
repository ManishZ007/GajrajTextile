package com.gajraj.payment.service;

import com.gajraj.payment.dto.CreateOrderRequest;
import com.gajraj.payment.dto.VerifyPaymentRequest;
import com.gajraj.payment.entity.PaymentRecord;
import com.gajraj.payment.feign.OrderServiceClient;
import com.gajraj.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentServiceTest {
    private final PaymentRepository repository = mock(PaymentRepository.class);
    private final OrderServiceClient orders = mock(OrderServiceClient.class);
    private final PaymentGateway gateway = mock(PaymentGateway.class);
    private final PaymentService service = new PaymentService(repository, orders, gateway);
    private final PaymentRecord record = new PaymentRecord();
    private final VerifyPaymentRequest request = new VerifyPaymentRequest();

    @BeforeEach
    void setup() throws Exception {
        ReflectionTestUtils.setField(service, "keySecret", "test-secret");
        record.setOrderId("shop-order");
        record.setRazorpayOrderId("rzp-order");
        record.setAmount(100L);
        when(gateway.payments("rzp-order")).thenReturn(java.util.List.of(new PaymentGateway.Details("rzp-payment","rzp-order","captured",10000L,"INR")));
        record.setStatus(PaymentRecord.PaymentStatus.INITIATED);
        request.setRazorpayOrderId("rzp-order");
        request.setRazorpayPaymentId("rzp-payment");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        request.setRazorpaySignature(HexFormat.of().formatHex(
                mac.doFinal("rzp-order|rzp-payment".getBytes(StandardCharsets.UTF_8))));
        when(repository.findByRazorpayOrderId("rzp-order")).thenReturn(Optional.of(record));
    }

    @Test
    void requiresShopOrderBeforePayment() {
        CreateOrderRequest create = new CreateOrderRequest();
        create.setAmount(100L);
        assertThrows(IllegalArgumentException.class, () -> service.createOrder(create));
        verifyNoInteractions(repository, orders);
    }

    @Test
    void confirmsLinkedOrderAndReturnsItsId() {
        assertEquals("shop-order", service.verifyPayment(request).get("orderId"));
        verify(orders).confirmOrder("shop-order");
        assertEquals(PaymentRecord.PaymentStatus.PAID, record.getStatus());
    }

    @Test
    void confirmationFailureCanRetrySamePayment() {
        when(orders.confirmOrder("shop-order")).thenThrow(new RuntimeException("Unavailable"));
        assertThrows(RuntimeException.class, () -> service.verifyPayment(request));
        assertEquals(PaymentRecord.PaymentStatus.PAID, record.getStatus());
        doReturn(null).when(orders).confirmOrder("shop-order");
        assertEquals("shop-order", service.verifyPayment(request).get("orderId"));
    }

    @Test
    void invalidSignatureCannotDowngradePaidRecord() {
        record.setStatus(PaymentRecord.PaymentStatus.PAID);
        request.setRazorpaySignature("invalid");
        assertNull(service.verifyPayment(request));
        assertEquals(PaymentRecord.PaymentStatus.PAID, record.getStatus());
        verifyNoInteractions(orders);
        verify(repository, never()).save(any());
    }

    @Test
    void missingRecordCannotReportSuccess() {
        when(repository.findByRazorpayOrderId("rzp-order")).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.verifyPayment(request));
        verifyNoInteractions(orders);
    }

    @Test
    void verifiedFailureReleasesReservation() throws Exception {
        when(gateway.payments("rzp-order")).thenReturn(java.util.List.of(
                new PaymentGateway.Details("failed","rzp-order","failed",10000,"INR")));
        assertFalse(service.reconcile("rzp-order"));
        verify(orders).failed(eq("shop-order"), any());
        assertEquals(PaymentRecord.PaymentStatus.FAILED, record.getStatus());
        verify(orders, never()).confirmOrder(any());
    }

    @Test
    void browserErrorDoesNotReleaseAnUnresolvedPayment() throws Exception {
        when(gateway.payments("rzp-order")).thenReturn(java.util.List.of());
        assertFalse(service.reconcile("rzp-order"));
        verifyNoInteractions(orders);
    }

    @Test
    void expiredUnpaidCheckoutIsCancelled() throws Exception {
        when(gateway.payments("rzp-order")).thenReturn(java.util.List.of());
        record.setReservationExpiresAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC).minusMinutes(1));
        assertFalse(service.reconcile("rzp-order"));
        verify(orders).failed(eq("shop-order"), any());
    }

    @Test
    void wrongAmountCannotCommitStock() throws Exception {
        when(gateway.payments("rzp-order")).thenReturn(java.util.List.of(
                new PaymentGateway.Details("payment","rzp-order","captured",1,"INR")));
        assertThrows(IllegalStateException.class, () -> service.reconcile("rzp-order"));
        verifyNoInteractions(orders);
    }
}
