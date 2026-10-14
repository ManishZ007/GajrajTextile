package com.gajraj.order.service;

import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import com.gajraj.order.feign.*;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomerReservationServiceTest {
    CustomerReservationRepo reservations=mock(CustomerReservationRepo.class);
    ReservationPaymentRepo payments=mock(ReservationPaymentRepo.class);
    OrdersRepo orders=mock(OrdersRepo.class);
    ProductServiceClient product=mock(ProductServiceClient.class);
    ReservationCustomerClient customers=mock(ReservationCustomerClient.class);
    CustomerReservationService service=new CustomerReservationService(reservations,payments,orders,product,customers,"token","Business","123456","TEST0001234");
    UUID id=UUID.randomUUID(),variant=UUID.randomUUID();
    CustomerReservation r=new CustomerReservation();
    @BeforeEach void setup() {
        r.setId(id);r.setUserId("customer");r.setTotal(new BigDecimal("1000.50"));r.setDepositPercent(40);
        r.setAddressId("1");r.setManagerId("manager");r.setHoldExpiresAt(Instant.now().plusSeconds(3600));
        var item=new CustomerReservation.Item();item.setVariantId(variant.toString());item.setProductId("product");
        item.setName("Saree");item.setQuantity(1);item.setUnitPrice(r.getTotal());r.getItems().add(item);
        when(reservations.lock(id)).thenReturn(Optional.of(r));when(reservations.findById(id)).thenReturn(Optional.of(r));
    }
    ReservationPayment pending() {
        var p=new ReservationPayment();p.setId(UUID.randomUUID());p.setReservationId(id);p.setClaimedAmount(new BigDecimal("400.20"));
        when(payments.findById(p.getId())).thenReturn(Optional.of(p));return p;
    }
    @Test void onlyOwnerCanReadDetailsOrScreenshot() {
        assertEquals(403,assertThrows(ResponseStatusException.class,()->service.get(id,"other",false)).getStatusCode().value());
        assertThrows(ResponseStatusException.class,()->service.proof(id,UUID.randomUUID(),"other",false));
        verifyNoInteractions(payments);
    }
    @Test void confirmationUses24HourStockHoldOnce() {
        when(product.customerHold(eq(id),eq("token"),any())).thenReturn(Map.of("expiresAt",Instant.now().plusSeconds(86400).toString()));
        service.confirm(id,"manager");service.confirm(id,"manager");
        assertEquals("AWAITING_DEPOSIT",r.getStatus());verify(product,times(1)).customerHold(id,"token",Map.of(variant,1));
    }
    @Test void confirmationWorksWithoutBankConfiguration() {
        var unconfigured=new CustomerReservationService(reservations,payments,orders,product,customers,"token","","","");
        when(product.customerHold(eq(id),eq("token"),any())).thenReturn(Map.of("expiresAt",Instant.now().plusSeconds(86400).toString()));
        unconfigured.confirm(id,"manager");assertEquals("AWAITING_DEPOSIT",r.getStatus());assertEquals("",r.getBankInstructions());
    }
    CustomerReservationService.ReceivedPayment receipt(String amount) {
        return new CustomerReservationService.ReceivedPayment(UUID.randomUUID(),new BigDecimal(amount),"UTR123456",Instant.now(),"Verified receipt after phone call");
    }
    @Test void managerRecordsFlexibleBatchAndDuplicateRetryOnlyOnce() {
        r.setTotal(new BigDecimal("30000"));r.setPaid(new BigDecimal("15000"));r.setStatus("RESERVED");
        var input=receipt("12000");
        when(payments.saveAndFlush(any())).thenAnswer(c->{ReservationPayment p=c.getArgument(0);when(payments.findById(p.getId())).thenReturn(Optional.of(p));return p;});
        var result=service.recordReceived(id,"manager",input);service.recordReceived(id,"manager",input);
        assertEquals(new BigDecimal("27000.00"),r.getPaid());assertEquals(0,new BigDecimal("3000").compareTo(result.remaining()));
        verify(payments,times(1)).saveAndFlush(argThat(p->"VERIFIED".equals(p.getStatus()) && "manager".equals(p.getReviewedBy()) && p.getReceivedAt()!=null && !p.isHasProof()));
        verifyNoInteractions(orders);
    }
    @Test void managerDepositProtectsStockWithoutCustomerUpload() {
        r.setStatus("AWAITING_DEPOSIT");service.recordReceived(id,"manager",receipt("400.20"));
        assertEquals("RESERVED",r.getStatus());assertEquals("COMMIT",r.getStockAction());verify(product).review(id,"token",true);
    }
    @Test void managerCannotRecordInvalidOrOverlappingPayments() {
        r.setStatus("AWAITING_DEPOSIT");
        for(String amount:List.of("0","-1","1001","1")) assertThrows(ResponseStatusException.class,()->service.recordReceived(id,"manager",receipt(amount)));
        r.setStatus("RESERVED");r.setPaid(new BigDecimal("400.20"));
        when(payments.existsByReservationIdAndStatus(id,"PENDING")).thenReturn(true);
        assertThrows(ResponseStatusException.class,()->service.recordReceived(id,"manager",receipt("100")));
        verify(payments,never()).saveAndFlush(any());
    }
    @Test void finalManualBatchEnablesFulfillmentOnlyAfterFullBalance() {
        r.setStatus("RESERVED");r.setPaid(new BigDecimal("400.20"));
        when(orders.saveAndFlush(any())).thenAnswer(c->{Orders o=c.getArgument(0);o.setId(UUID.randomUUID());return o;});
        service.recordReceived(id,"manager",receipt("600.30"));assertEquals("FULLY_PAID",r.getStatus());
        verifyNoInteractions(orders);service.syncStock(id);assertNotNull(r.getOrderId());
    }
    @Test void timelyProofProtectsStockAndDoesNotCountAsPaid() {
        r.setStatus("AWAITING_DEPOSIT");
        var proof=new CustomerReservationService.Proof(UUID.randomUUID(),new BigDecimal("400.20"),"REF12345",png());
        service.submit(id,"customer",proof);
        assertEquals("PAYMENT_REVIEW",r.getStatus());assertEquals(BigDecimal.ZERO,r.getPaid());verify(product).review(id,"token",true);
    }
    @Test void rejectsUnderDepositAndOverpayment() {
        r.setStatus("AWAITING_DEPOSIT");
        for(String amount:List.of("1","1001")) assertThrows(ResponseStatusException.class,()->service.submit(id,"customer",
            new CustomerReservationService.Proof(UUID.randomUUID(),new BigDecimal(amount),"REF12345",png())));
        verify(payments,never()).saveAndFlush(any());verifyNoInteractions(product);
    }
    @Test void approvedDepositAfterDeadlineCommitsOnceAndDoesNotCreateFulfillment() {
        r.setStatus("PAYMENT_REVIEW");r.setHoldExpiresAt(Instant.now().minusSeconds(100));var p=pending();
        var review=new CustomerReservationService.Review(true,new BigDecimal("400.20"),"Bank credit matched");
        service.review(id,p.getId(),"manager",review);service.review(id,p.getId(),"manager",review);
        assertEquals("RESERVED",r.getStatus());assertEquals(new BigDecimal("400.20"),r.getPaid());
        service.syncStock(id); service.syncStock(id);
        verify(product,times(1)).commit(id,"token");verifyNoInteractions(orders);
    }
    @Test void fullPaymentCreatesExactlyOneConfirmedBankOrder() {
        r.setStatus("RESERVED");r.setPaid(new BigDecimal("400.20"));var p=pending();UUID orderId=UUID.randomUUID();
        when(orders.saveAndFlush(any())).thenAnswer(c->{Orders o=c.getArgument(0);o.setId(orderId);return o;});
        var review=new CustomerReservationService.Review(true,new BigDecimal("600.30"),"Bank matched");
        service.review(id,p.getId(),"manager",review);service.review(id,p.getId(),"manager",review);
        verifyNoInteractions(orders);
        service.syncStock(id);service.syncStock(id);
        assertEquals("FULLY_PAID",r.getStatus());assertEquals(orderId,r.getOrderId());
        verify(orders,times(1)).saveAndFlush(argThat(o->o.getOrderStatus()==Orders.OrderStatus.CONFIRMED && "BANK_TRANSFER".equals(o.getPaymentMethod()) && o.getIntegrationPending() && o.getStockDeducted()));
    }
    @Test void pendingReviewIsNeverExpiredOrCancelled() {
        r.setStatus("PAYMENT_REVIEW");r.setHoldExpiresAt(Instant.now().minusSeconds(100));
        when(payments.existsByReservationIdAndStatus(id,"PENDING")).thenReturn(true);
        service.expire(id);assertEquals("PAYMENT_REVIEW",r.getStatus());
        assertThrows(ResponseStatusException.class,()->service.cancel(id,"customer",false,"Changed mind"));verifyNoInteractions(product);
    }
    @Test void duplicateProofIsReturnedWithoutChangingStockOrBalance() {
        var p=pending();
        service.submit(id,"customer",new CustomerReservationService.Proof(p.getId(),new BigDecimal("400.20"),"REF12345",png()));
        verify(payments,never()).saveAndFlush(any());verifyNoInteractions(product);
    }
    @Test void stockOutageRetainsVerifiedCreditAndDurableRetry() {
        r.setStatus("PAYMENT_REVIEW");var p=pending();
        service.review(id,p.getId(),"manager",new CustomerReservationService.Review(true,new BigDecimal("400.20"),"Matched bank"));
        doThrow(new RuntimeException("Unavailable")).when(product).commit(id,"token");
        assertThrows(RuntimeException.class,()->service.syncStock(id));
        assertEquals("COMMIT",r.getStockAction());assertEquals("VERIFIED",p.getStatus());assertEquals(new BigDecimal("400.20"),r.getPaid());
        doNothing().when(product).commit(id,"token");service.syncStock(id);assertNull(r.getStockAction());
    }
    @Test void paidReservationCannotBeCancelledAndRestockedWithoutRefund() {
        r.setPaid(new BigDecimal("400.20"));r.setStatus("RESERVED");
        assertThrows(ResponseStatusException.class,()->service.cancel(id,"manager",true,"Cancel"));verifyNoInteractions(product);
    }
    @Test void rejectingLateProofEndsWindowWithoutCountingPayment() {
        r.setStatus("PAYMENT_REVIEW");r.setHoldExpiresAt(Instant.now().minusSeconds(100));var p=pending();
        service.review(id,p.getId(),"manager",new CustomerReservationService.Review(false,null,"No bank credit found"));
        assertEquals("EXPIRED",r.getStatus());assertEquals(BigDecimal.ZERO,r.getPaid());
        service.syncStock(id);verify(product).review(id,"token",false);verify(product).release(id,"token");
    }
    @Test void authoritativeQuoteAndOwnedAddressAreUsed() {
        UUID newId=UUID.randomUUID();
        when(customers.profile("Bearer customer")).thenReturn(Map.of("authentication",Map.of("auth",Map.of("userId","customer","fullName","Customer","email","c@example.com","phoneNumber","123")),
            "customer",Map.of("addresses",List.of(Map.of("id",1,"street","Street","city","City","state","State","postalCode","123456","country","India")))));
        when(product.quote(variant.toString(),"token")).thenReturn(Map.of("productId","product","price",new BigDecimal("1000.50"),"availableStock",2,"name","Saree","variantLabel","Red"));
        var result=service.request(new CustomerReservationService.Request(newId,"1",50,List.of(new CustomerReservationService.RequestedItem("product",variant.toString(),2))),"customer","Bearer customer");
        assertEquals(new BigDecimal("2001.00"),result.reservation().getTotal());assertEquals(new BigDecimal("1000.50"),result.depositRequired());
        verify(product,never()).customerHold(any(),any(),any());
        assertThrows(ResponseStatusException.class,()->service.request(new CustomerReservationService.Request(UUID.randomUUID(),"other",40,List.of(new CustomerReservationService.RequestedItem("product",variant.toString(),1))),"customer","Bearer customer"));
    }
    String png() { return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH3sAAAAASUVORK5CYII="; }
}
