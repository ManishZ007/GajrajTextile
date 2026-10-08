package com.gajraj.product.service;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ApprovedPriceServiceTest {
 @Test void appliesBasePriceAndRecordsReceipt() {
  var products=mock(ProductsRepo.class);var receipts=mock(AppliedPriceChangeRepo.class);var service=new ApprovedPriceService(products,receipts);
  var id=UUID.randomUUID();var request=UUID.randomUUID();var product=new Products();product.setBasePrice(new BigDecimal("100"));
  when(products.lockForPrice(id)).thenReturn(Optional.of(product));when(receipts.findById(request)).thenReturn(Optional.empty());
  service.apply(request,new ApprovedPriceService.Change(id,new BigDecimal("100"),new BigDecimal("150")));
  assertEquals(new BigDecimal("150"),product.getBasePrice());verify(receipts).save(any(AppliedPriceChange.class));
 }
 @Test void staleRequestCannotOverwritePrice() {
  var products=mock(ProductsRepo.class);var receipts=mock(AppliedPriceChangeRepo.class);var service=new ApprovedPriceService(products,receipts);
  var id=UUID.randomUUID();var product=new Products();product.setBasePrice(new BigDecimal("200"));when(products.lockForPrice(id)).thenReturn(Optional.of(product));
  assertEquals(409,assertThrows(ResponseStatusException.class,()->service.apply(UUID.randomUUID(),new ApprovedPriceService.Change(id,new BigDecimal("100"),new BigDecimal("150")))).getStatusCode().value());
  verify(products,never()).save(any());verify(receipts,never()).save(any());
 }
 @Test void retryDoesNotOverwriteLaterPrice() {
  var products=mock(ProductsRepo.class);var receipts=mock(AppliedPriceChangeRepo.class);var service=new ApprovedPriceService(products,receipts);
  var id=UUID.randomUUID();var request=UUID.randomUUID();var product=new Products();product.setBasePrice(new BigDecimal("200"));when(products.lockForPrice(id)).thenReturn(Optional.of(product));
  var receipt=new AppliedPriceChange();receipt.setProductId(id);receipt.setOldPrice(new BigDecimal("100"));receipt.setNewPrice(new BigDecimal("150"));when(receipts.findById(request)).thenReturn(Optional.of(receipt));
  service.apply(request,new ApprovedPriceService.Change(id,new BigDecimal("100"),new BigDecimal("150")));
  assertEquals(new BigDecimal("200"),product.getBasePrice());verify(products,never()).save(any());
 }
}
