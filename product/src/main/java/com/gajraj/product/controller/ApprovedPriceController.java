package com.gajraj.product.controller;
import com.gajraj.product.service.ApprovedPriceService;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
@RestController
@RequestMapping("/product/internal/approved-prices")
public class ApprovedPriceController {
 private final ApprovedPriceService service; private final String token;
 public ApprovedPriceController(ApprovedPriceService service,@Value("${PRODUCT_PRICE_TOKEN:}") String token){this.service=service;this.token=token;}
 @PutMapping("/{id}")
 public Map<String,Boolean> apply(@PathVariable UUID id,@RequestBody ApprovedPriceService.Change change,@RequestHeader(value="X-Service-Token",required=false) String supplied){
  if(token.isBlank() || supplied==null || !java.security.MessageDigest.isEqual(token.getBytes(java.nio.charset.StandardCharsets.UTF_8),supplied.getBytes(java.nio.charset.StandardCharsets.UTF_8))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  service.apply(id,change);return Map.of("applied",true);
 }
}
