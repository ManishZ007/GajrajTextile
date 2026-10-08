package com.gajraj.product.service;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import com.gajraj.product.dto.ProductCreateRequestDTO.VariantRequest;
import org.junit.jupiter.api.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ProductVariantEditorTest {
    final ProductVariantsRepo repo=mock(ProductVariantsRepo.class);
    final StockHistoryRepo history=mock(StockHistoryRepo.class);
    final jakarta.persistence.EntityManager em=mock(jakarta.persistence.EntityManager.class);
    final ProductVariantEditor editor=new ProductVariantEditor(repo,history,em);
    final Products product=new Products(); final ProductVariants variant=new ProductVariants();
    final UUID id=UUID.randomUUID();
    @BeforeEach void setup() {
        variant.setVariantId(id); variant.setStockQuantity(7); variant.setSku("original");
        product.setVariants(new ArrayList<>(List.of(variant)));
        when(repo.lockStock(id)).thenReturn(Optional.of(variant));
    }
    VariantRequest request() { var r=new VariantRequest();r.setVariantId(id);r.setSku("new");r.setStatus("ACTIVE");return r; }
    @AfterEach void clear(){SecurityContextHolder.clearContext();}
    @Test void editingPreservesIdentityStockAndHistory() {
        editor.update(product,List.of(request()));
        assertSame(variant,product.getVariants().getFirst()); assertEquals(id,variant.getVariantId());
        assertEquals(7,variant.getStockQuantity());assertEquals("new",variant.getSku());
        verify(em).refresh(variant,jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        verifyNoInteractions(history);verify(repo,never()).delete(any(ProductVariants.class));
    }
    @Test void stockOverwriteAndMissingExistingVariantRejected(){
        var r=request();r.setStockQuantity(20);
        assertThrows(IllegalArgumentException.class,()->editor.update(product,List.of(r)));
        assertThrows(IllegalArgumentException.class,()->editor.update(product,List.of()));
        assertEquals(7,variant.getStockQuantity());verifyNoInteractions(history);
    }
    @Test void foreignAndDuplicateIdsRejected(){
        var r=request();r.setVariantId(UUID.randomUUID());
        assertThrows(IllegalArgumentException.class,()->editor.update(product,List.of(r)));
        assertThrows(IllegalArgumentException.class,()->editor.update(product,List.of(request(),request())));
    }
    @Test void initialStockIsAuditedWithSignedActor(){
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("manager-id",null,List.of()));
        var r=request();r.setVariantId(null);r.setStockQuantity(5);
        var result=editor.create(product,r);
        assertEquals(5,result.getStockQuantity());
        verify(history).save(argThat(h->h.getChangedBy().equals("manager-id") && h.getPreviousQuantity()==0 && h.getNewQuantity()==5));
    }
    @Test void negativeInitialStockAndNonzeroNewEditVariantRejected(){
        var r=request();r.setVariantId(null);r.setStockQuantity(-1);
        assertThrows(IllegalArgumentException.class,()->editor.create(product,r));
        r.setStockQuantity(3);
        assertThrows(IllegalArgumentException.class,()->editor.update(product,List.of(request(),r)));
        verify(repo,never()).save(any());
    }
}
