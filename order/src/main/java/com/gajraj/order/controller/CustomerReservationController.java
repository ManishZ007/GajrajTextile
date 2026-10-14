package com.gajraj.order.controller;
import com.gajraj.order.service.CustomerReservationService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController @RequestMapping({"/reservations/in-stock","/manager/reservations/in-stock"})
public class CustomerReservationController {
    private final CustomerReservationService service;
    public CustomerReservationController(CustomerReservationService service) { this.service=service; }
    private boolean staff(Authentication a) {
        return a!=null && a.getAuthorities().stream().anyMatch(x->Set.of("ROLE_MANAGER","ROLE_OWNER").contains(x.getAuthority()));
    }
    private void manager(Authentication a) { if(!staff(a)) throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    private void customer(Authentication a) {
        if(a==null || a.getAuthorities().stream().noneMatch(x->x.getAuthority().equals("ROLE_CUSTOMER"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    @GetMapping public Object list(Authentication a,@RequestParam(defaultValue="0") int page) { return service.list(a.getName(),staff(a),page); }
    @GetMapping("/{id}") public Object get(@PathVariable UUID id,Authentication a) { return service.get(id,a.getName(),staff(a)); }
    @PostMapping public Object request(@RequestBody CustomerReservationService.Request body,Authentication a,@RequestHeader("Authorization") String authorization) {
        customer(a); return service.request(body,a.getName(),authorization);
    }
    @PostMapping("/{id}/confirm") public Object confirm(@PathVariable UUID id,Authentication a) { manager(a); return service.confirm(id,a.getName()); }
    @PostMapping("/{id}/cancel") public Object cancel(@PathVariable UUID id,Authentication a,@RequestBody Map<String,String> body) { return service.cancel(id,a.getName(),staff(a),body.get("reason")); }
    @PostMapping("/{id}/payments") public Object submit(@PathVariable UUID id,Authentication a,@RequestBody CustomerReservationService.Proof body) { customer(a); return service.submit(id,a.getName(),body); }
    @PostMapping("/{id}/received-payments") public Object received(@PathVariable UUID id,Authentication a,@RequestBody CustomerReservationService.ReceivedPayment body) {
        manager(a); return service.recordReceived(id,a.getName(),body);
    }
    @PostMapping("/{id}/payments/{paymentId}/review") public Object review(@PathVariable UUID id,@PathVariable UUID paymentId,Authentication a,@RequestBody CustomerReservationService.Review body) {
        manager(a); return service.review(id,paymentId,a.getName(),body);
    }
    @GetMapping("/{id}/payments/{paymentId}/proof") public ResponseEntity<byte[]> proof(@PathVariable UUID id,@PathVariable UUID paymentId,Authentication a) {
        var proof=service.proof(id,paymentId,a.getName(),staff(a));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(proof.getProofType())).cacheControl(CacheControl.noStore())
            .header("X-Content-Type-Options","nosniff").body(proof.getProof());
    }
    @ExceptionHandler(ResponseStatusException.class) public ResponseEntity<?> error(ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(Map.of("error",Objects.toString(e.getReason(),"Request rejected"))); }
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class) public ResponseEntity<?> duplicate() { return ResponseEntity.status(409).body(Map.of("error","This request or bank transaction reference already exists. Refresh before retrying.")); }
    @ExceptionHandler({IllegalArgumentException.class,IllegalStateException.class}) public ResponseEntity<?> invalid(RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error",Objects.toString(e.getMessage(),"Invalid request"))); }
    @ExceptionHandler(feign.FeignException.class) public ResponseEntity<?> dependency(feign.FeignException e) { return ResponseEntity.status(503).body(Map.of("error","Customer or stock service could not complete the request. Refresh and check stock availability before retrying.")); }
}
