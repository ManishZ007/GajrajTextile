package com.gajraj.product.service;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import com.gajraj.product.dto.StockUpdateDTO;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class StockManagementServiceTest {
    final ProductVariantsRepo variants = mock(ProductVariantsRepo.class);
    final StockHistoryRepo history = mock(StockHistoryRepo.class);
    final ProductImagesRepo images = mock(ProductImagesRepo.class);
    final StockManagementService service = new StockManagementService();
    final ProductVariants variant = new ProductVariants();
    final UUID id = UUID.randomUUID();
    @BeforeEach void setup() {
        ReflectionTestUtils.setField(service,"productVariantsRepo",variants);
        ReflectionTestUtils.setField(service,"stockHistoryRepo",history);
        ReflectionTestUtils.setField(service,"productImagesRepo",images);
        var category = new ProductCategories(); category.setName("Sarees");
        var product = new Products(); product.setCategory(category); product.setName("Paithani");
        variant.setProduct(product); variant.setVariantId(id); variant.setStockQuantity(3); variant.setStatus("ACTIVE");
        when(variants.lockStock(id)).thenReturn(Optional.of(variant));
        when(images.findByProductAndIsPrimaryTrue(product)).thenReturn(Optional.empty());
    }
    StockUpdateDTO adjustment(int amount) {
        var dto = new StockUpdateDTO(); dto.setAdjustmentAmount(amount); dto.setReason("New stock received"); dto.setChangedBy("signed-manager"); return dto;
    }
    @Test void restockUsesCheckoutLockAndRecordsActorAndQuantities() {
        service.updateStock(id,adjustment(4));
        assertEquals(7,variant.getStockQuantity()); verify(variants).lockStock(id); verify(variants,never()).findById(any());
        verify(history).save(argThat(h -> h.getChangedBy().equals("signed-manager") && h.getPreviousQuantity()==3 && h.getNewQuantity()==7 && h.getChangeAmount()==4));
    }
    @Test void staleSetCannotOverwriteCheckoutDeduction() {
        var dto=adjustment(1); dto.setAdjustmentAmount(null); dto.setNewQuantity(9); dto.setExpectedQuantity(4);
        assertThrows(IllegalArgumentException.class,()->service.updateStock(id,dto));
        assertEquals(3,variant.getStockQuantity()); verify(history,never()).save(any());
        dto.setExpectedQuantity(3); service.updateStock(id,dto); assertEquals(9,variant.getStockQuantity());
    }
    @Test void stockCannotGoNegativeOrOverflow() {
        assertThrows(IllegalArgumentException.class,()->service.updateStock(id,adjustment(-4)));
        assertThrows(ArithmeticException.class,()->service.updateStock(id,adjustment(Integer.MAX_VALUE)));
        assertEquals(3,variant.getStockQuantity()); verify(history,never()).save(any());
    }
    @Test void restockDoesNotActivateAnInactiveVariant() {
        variant.setStockQuantity(0); variant.setStatus("INACTIVE"); service.updateStock(id,adjustment(2));
        assertEquals("INACTIVE",variant.getStatus());
        variant.setStatus("OUT_OF_STOCK"); service.updateStock(id,adjustment(2)); assertEquals("ACTIVE",variant.getStatus());
    }
    @Test void noOpAndMissingReasonsRejected() {
        assertThrows(IllegalArgumentException.class,()->service.updateStock(id,adjustment(0)));
        var dto=adjustment(1); dto.setReason(" "); assertThrows(IllegalArgumentException.class,()->service.updateStock(id,dto));
        verify(history,never()).save(any());
    }
    @Test void duplicateBulkVariantsRejectedBeforeAnyWrite() {
        var item = new StockUpdateDTO.BulkStockUpdateItem(); item.setVariantId(id);
        assertThrows(IllegalArgumentException.class,()->service.bulkUpdateStock(List.of(item,item)));
        verifyNoInteractions(variants,history);
    }
}
