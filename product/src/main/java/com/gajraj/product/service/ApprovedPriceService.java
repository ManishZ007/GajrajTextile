package com.gajraj.product.service;
import com.gajraj.product.repo.*;
import com.gajraj.product.model.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.math.BigDecimal;
import java.util.UUID;
@Service
public class ApprovedPriceService {
 private final ProductsRepo products; private final AppliedPriceChangeRepo receipts;
 public ApprovedPriceService(ProductsRepo products, AppliedPriceChangeRepo receipts) {this.products=products;this.receipts=receipts;}
 public record Change(UUID productId, BigDecimal oldPrice, BigDecimal newPrice) {}
 @Transactional
 public void apply(UUID id, Change change) {
  if(change.productId()==null || !valid(change.oldPrice()) || !valid(change.newPrice())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid price");
  var product=products.lockForPrice(change.productId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Product not found"));
  var previous=receipts.findById(id);
  if(previous.isPresent()) {
   var r=previous.get();
   if(!r.getProductId().equals(change.productId()) || r.getOldPrice().compareTo(change.oldPrice())!=0 || r.getNewPrice().compareTo(change.newPrice())!=0)
    throw new ResponseStatusException(HttpStatus.CONFLICT,"Request ID already used");
   return;
  }
  if(product.getBasePrice().compareTo(change.oldPrice())!=0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Current price changed; submit a new price request");
  product.setBasePrice(change.newPrice());products.save(product);
  var receipt=new AppliedPriceChange();receipt.setId(id);receipt.setProductId(change.productId());receipt.setOldPrice(change.oldPrice());receipt.setNewPrice(change.newPrice());receipts.save(receipt);
 }
 private boolean valid(BigDecimal p) {return p!=null && p.signum()>0 && p.compareTo(new BigDecimal("99999999.99"))<=0 && p.stripTrailingZeros().scale()<=2;}
}
