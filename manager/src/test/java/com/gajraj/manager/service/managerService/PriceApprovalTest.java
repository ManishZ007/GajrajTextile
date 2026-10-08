package com.gajraj.manager.service.managerService;
import com.gajraj.manager.repo.*;
import com.gajraj.manager.model.*;
import com.gajraj.manager.feign.ProductPriceClient;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import java.math.BigDecimal;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class PriceApprovalTest {
 @Test void approvalRequiresProductConfirmationAndRejectionDoesNotUpdateProduct() {
  var repo=mock(ProductPriceUpdatedRepo.class);var reports=mock(OwnerReportsRepo.class);var product=mock(ProductPriceClient.class);var service=new PriceChangeService();
  ReflectionTestUtils.setField(service,"productPriceUpdatedRepo",repo);ReflectionTestUtils.setField(service,"ownerReportsRepo",reports);ReflectionTestUtils.setField(service,"products",product);ReflectionTestUtils.setField(service,"priceToken","test");
  var id=UUID.randomUUID();var row=new ProductPriceUpdates();row.setId(id);row.setProductId(UUID.randomUUID().toString());row.setOldPrice(new BigDecimal("100"));row.setNewPrice(new BigDecimal("150"));when(repo.lockForApproval(id)).thenReturn(Optional.of(row));when(repo.save(row)).thenReturn(row);
  when(product.apply(eq(id),eq("test"),any())).thenReturn(Map.of("applied",false));
  assertEquals(503,service.approvePriceChange(id,true).getStatusCode().value());assertNull(row.getOwnerApproval());verify(repo,never()).save(any());
  when(product.apply(eq(id),eq("test"),any())).thenReturn(Map.of("applied",true));
  assertEquals(200,service.approvePriceChange(id,true).getStatusCode().value());assertTrue(row.getPriceApplied());
  row.setOwnerApproval(null);clearInvocations(product);
  assertEquals(200,service.approvePriceChange(id,false).getStatusCode().value());verifyNoInteractions(product);
 }
}
