package com.gajraj.product.service;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.junit.jupiter.api.*;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static com.gajraj.product.model.StockReservation.State.*;

class StockReservationServiceTest {
    private final StockReservationRepo repo = mock(StockReservationRepo.class);
    private final ProductVariantsRepo variants = mock(ProductVariantsRepo.class);
    private final StockHistoryRepo history = mock(StockHistoryRepo.class);
    private final StockReservationService service = new StockReservationService(repo,variants,history,900,mock(org.springframework.jdbc.core.JdbcTemplate.class));
    private final UUID orderId = UUID.randomUUID(), variantId = UUID.randomUUID();
    private final ProductVariants variant = new ProductVariants();
    @BeforeEach void setup() {
        variant.setStockQuantity(3); variant.setStatus("ACTIVE");
        when(variants.lockStock(variantId)).thenReturn(Optional.of(variant));
        when(repo.saveAndFlush(any())).thenAnswer(c -> {
            StockReservation r = c.getArgument(0);
            when(repo.lock(orderId)).thenReturn(Optional.of(r));
            return r;
        });
    }
    @Test void remakeQuoteRequiresUnavailableSellableVariantAndNeverChangesStock() {
        var product=new Products();product.setProductId(UUID.randomUUID());product.setName("Saree");product.setStatus("ACTIVE");
        variant.setProduct(product);variant.setPrice(new java.math.BigDecimal("1000"));
        when(variants.findById(variantId)).thenReturn(Optional.of(variant));
        assertThrows(IllegalStateException.class,()->service.remakeQuote(variantId));
        variant.setStockQuantity(0);assertEquals(0,service.remakeQuote(variantId).get("availableStock"));
        product.setStatus("ARCHIVED");assertThrows(IllegalStateException.class,()->service.remakeQuote(variantId));
        verifyNoInteractions(repo,history);
    }
    @Test void retriesDoNotDeductOrExtendTwice() {
        var hold=service.reserve(orderId,Map.of(variantId,2));
        var expiry=hold.getExpiresAt();
        assertSame(hold,service.reserve(orderId,Map.of(variantId,2)));
        assertEquals(1,variant.getStockQuantity()); assertEquals(expiry,hold.getExpiresAt());
        verify(history,times(1)).save(any());
    }
    @Test void customerHoldLasts24HoursAndPendingReviewSurvivesExpiry() {
        var before=Instant.now();
        var hold=service.reserveCustomer(orderId,Map.of(variantId,2));
        assertTrue(hold.getExpiresAt().isAfter(before.plusSeconds(86399)));
        service.review(orderId,true);
        hold.setExpiresAt(Instant.now().minusSeconds(5));
        service.release(orderId,true);
        assertEquals(HELD,hold.getState()); assertEquals(1,variant.getStockQuantity());
        service.commit(orderId); service.commit(orderId);
        assertEquals(COMMITTED,hold.getState()); assertEquals(1,variant.getStockQuantity());
    }
    @Test void rejectedReviewAllowsExpiryToRestoreStockOnce() {
        var hold=service.reserveCustomer(orderId,Map.of(variantId,2));
        service.review(orderId,true); hold.setExpiresAt(Instant.now().minusSeconds(5));
        service.review(orderId,false); service.release(orderId,true); service.release(orderId,true);
        assertEquals(EXPIRED,hold.getState()); assertEquals(3,variant.getStockQuantity());
    }
    @Test void lateProofCannotReviveAnExpiredHold() {
        var hold=service.reserveCustomer(orderId,Map.of(variantId,1));
        hold.setExpiresAt(Instant.now().minusSeconds(1));
        assertThrows(IllegalStateException.class,()->service.review(orderId,true));
        service.release(orderId,true); assertEquals(EXPIRED,hold.getState());
    }
    @Test void committedStockIsNotReleasedOrDeductedAgain() {
        var hold=service.reserve(orderId,Map.of(variantId,2));
        service.commit(orderId); service.commit(orderId); service.release(orderId,false);
        assertEquals(COMMITTED,hold.getState()); assertEquals(1,variant.getStockQuantity());
    }
    @Test void failureReleaseIsIdempotent() {
        var hold=service.reserve(orderId,Map.of(variantId,3));
        assertEquals("OUT_OF_STOCK",variant.getStatus());
        service.release(orderId,false); service.release(orderId,false);
        assertEquals(RELEASED,hold.getState()); assertEquals(3,variant.getStockQuantity());
        assertEquals("ACTIVE",variant.getStatus());
    }
    @Test void onlyExpiredHoldsAreSwept() {
        var hold=service.reserve(orderId,Map.of(variantId,1));
        service.release(orderId,true); assertEquals(HELD,hold.getState());
        hold.setExpiresAt(Instant.now().minusSeconds(1));
        service.release(orderId,true); service.release(orderId,true);
        assertEquals(EXPIRED,hold.getState()); assertEquals(3,variant.getStockQuantity());
        assertThrows(IllegalStateException.class,()->service.commit(orderId));
    }
    @Test void changedBasketCannotReuseHold() {
        service.reserve(orderId,Map.of(variantId,1));
        assertThrows(IllegalStateException.class,()->service.reserve(orderId,Map.of(variantId,2)));
        assertEquals(2,variant.getStockQuantity());
    }
    @Test void stockCannotGoNegative() {
        assertThrows(IllegalStateException.class,()->service.reserve(orderId,Map.of(variantId,4)));
        assertEquals(3,variant.getStockQuantity()); verify(history,never()).save(any());
    }
    @Test void cancellationRestoresCommittedStockExactlyOnce() {
        var hold=service.reserve(orderId,Map.of(variantId,2));service.commit(orderId);
        service.cancel(orderId);service.cancel(orderId);
        assertEquals(RELEASED,hold.getState());assertEquals(3,variant.getStockQuantity());
        verify(history,times(2)).save(any());
    }
}
