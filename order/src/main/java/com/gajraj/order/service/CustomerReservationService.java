package com.gajraj.order.service;

import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import com.gajraj.order.feign.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.math.*;
import java.time.Instant;
import java.util.*;
import java.io.ByteArrayInputStream;
import javax.imageio.ImageIO;

@Service
public class CustomerReservationService {
    private final CustomerReservationRepo reservations;
    private final ReservationPaymentRepo payments;
    private final OrdersRepo orders;
    private final ProductServiceClient product;
    private final ReservationCustomerClient customers;
    private final String token;
    private final String bankInstructions;
    public CustomerReservationService(CustomerReservationRepo reservations, ReservationPaymentRepo payments,
            OrdersRepo orders, ProductServiceClient product, ReservationCustomerClient customers,
            @Value("${service.internal-token}") String token,
            @Value("${reservation.bank.account-name:}") String accountName,
            @Value("${reservation.bank.account-number:}") String accountNumber,
            @Value("${reservation.bank.ifsc:}") String ifsc) {
        this.reservations=reservations; this.payments=payments; this.orders=orders;
        this.product=product; this.customers=customers; this.token=token;
        this.bankInstructions=accountName.isBlank() || accountNumber.isBlank() || ifsc.isBlank() ? ""
                : "Account name: " + accountName + "\nAccount number: " + accountNumber + "\nIFSC: " + ifsc;
    }
    public record RequestedItem(String productId,String variantId,int quantity) {}
    public record Request(UUID requestId,String addressId,int depositPercent,List<RequestedItem> items) {}
    public record Proof(UUID submissionId,BigDecimal amount,String reference,String imageBase64) {}
    public record Review(boolean approved,BigDecimal amount,String note) {}
    public record ReceivedPayment(UUID submissionId,BigDecimal amount,String reference,Instant receivedAt,String note) {}
    public record Detail(CustomerReservation reservation,List<ReservationPayment> payments,BigDecimal depositRequired,
                         BigDecimal remaining,boolean bankConfigured,Map<String,Object> production) {}
    static BigDecimal money(BigDecimal amount) {
        if(amount==null || amount.signum()<=0 || amount.scale()>2 || amount.compareTo(new BigDecimal("99999999.99"))>0)
            throw bad("Enter a positive amount with no more than two decimal places");
        return amount.setScale(2);
    }
    static BigDecimal deposit(CustomerReservation r) {
        return r.getTotal().multiply(BigDecimal.valueOf(r.getDepositPercent())).divide(BigDecimal.valueOf(100),2,RoundingMode.CEILING);
    }
    private static ResponseStatusException bad(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST,message); }
    private CustomerReservation locked(UUID id) { return reservations.lock(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND)); }
    private void owner(CustomerReservation r,String user,boolean staff) {
        if(!staff && !r.getUserId().equals(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
    private Detail detail(CustomerReservation r) {
        var production=new HashMap<String,Object>();
        if("OUT_OF_STOCK".equals(r.getType()) && r.getOrderId()!=null) orders.findById(r.getOrderId()).ifPresent(o->{
            production.put("status",o.getRemakeStatus());production.put("workerName",o.getRemakeWorkerName());
            production.put("quality",o.getReadyMadeQuality());production.put("orderNumber",o.getOrderNumber());production.put("shipped",o.getShipmentStarted());
        });
        return new Detail(r,payments.findByReservationIdOrderBySubmittedAtAsc(r.getId()),deposit(r),r.getTotal().subtract(r.getPaid()),!bankInstructions.isBlank(),production);
    }
    @Transactional(readOnly=true)
    public Page<CustomerReservation> list(String user,boolean staff,int page) {
        return list(user,staff,page,"IN_STOCK");
    }
    @Transactional(readOnly=true)
    public Page<CustomerReservation> list(String user,boolean staff,int page,String type) {
        var p=PageRequest.of(Math.max(page,0),20,Sort.by(Sort.Direction.DESC,"createdAt"));
        return staff ? reservations.findByType(type,p) : reservations.findByUserIdAndType(user,type,p);
    }
    @Transactional(readOnly=true)
    public Detail get(UUID id,String user,boolean staff) {
        var r=reservations.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND)); owner(r,user,staff); return detail(r);
    }
    @SuppressWarnings("unchecked")
    @Transactional
    public Detail request(Request request,String user,String authorization) {
        return request(request,user,authorization,"IN_STOCK");
    }
    @SuppressWarnings("unchecked") @Transactional
    public Detail request(Request request,String user,String authorization,String type) {
        if(request.requestId()==null || !Set.of(40,50).contains(request.depositPercent()) || request.items()==null
                || request.items().isEmpty() || request.items().size()>30) throw bad("Select 40% or 50% and 1 to 30 items");
        if(!Set.of("IN_STOCK","OUT_OF_STOCK").contains(type)) throw bad("Invalid reservation type");
        var existing=reservations.findById(request.requestId());
        if(existing.isPresent()) { owner(existing.get(),user,false); if(!type.equals(existing.get().getType())) throw bad("Request ID belongs to another reservation type"); return detail(existing.get()); }
        var profile=customers.profile(authorization);
        var auth=(Map<String,Object>) ((Map<String,Object>)profile.get("authentication")).get("auth");
        var customer=(Map<String,Object>) profile.get("customer");
        if(!user.equals(String.valueOf(auth.get("userId")))) throw bad("Customer identity mismatch");
        var addresses=(List<Map<String,Object>>)customer.get("addresses");
        var address=addresses.stream().filter(a->String.valueOf(a.get("id")).equals(request.addressId())).findFirst()
                .orElseThrow(()->bad("Select one of your delivery addresses"));
        var r=new CustomerReservation(); r.setId(request.requestId()); r.setUserId(user); r.setAddressId(request.addressId());
        r.setType(type);
        r.setCustomerName(String.valueOf(auth.get("fullName"))); r.setEmail(String.valueOf(auth.get("email"))); r.setPhone(String.valueOf(auth.get("phoneNumber")));
        r.setAddress(String.join(", ",List.of("street","city","state","postalCode","country").stream().map(k->String.valueOf(address.get(k))).toList()));
        r.setDepositPercent(request.depositPercent()); BigDecimal total=BigDecimal.ZERO; Set<String> seen=new HashSet<>();
        for(var input:request.items()) {
            if(input.quantity()<1 || input.quantity()>100 || input.variantId()==null || !seen.add(input.variantId())) throw bad("Invalid or duplicate variant");
            UUID.fromString(input.variantId());
            var quote="OUT_OF_STOCK".equals(type) ? product.remakeQuote(input.variantId(),token) : product.quote(input.variantId(),token);
            if(!Objects.equals(input.productId(),String.valueOf(quote.get("productId")))) throw bad("Product and variant do not match");
            if(!"OUT_OF_STOCK".equals(type) && Integer.parseInt(quote.get("availableStock").toString())<input.quantity()) throw bad("An item is out of stock; this flow is for in-stock reservations only");
            var item=new CustomerReservation.Item(); item.setProductId(input.productId()); item.setVariantId(input.variantId());
            item.setQuantity(input.quantity()); item.setUnitPrice(money(new BigDecimal(quote.get("price").toString())));
            item.setName(String.valueOf(quote.get("name"))); item.setVariantLabel(String.valueOf(quote.get("variantLabel")));
            r.getItems().add(item); total=total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        r.setTotal(money(total)); reservations.saveAndFlush(r); return detail(r);
    }
    @Transactional
    public Detail confirm(UUID id,String manager) {
        var r=locked(id);
        if(!"REQUESTED".equals(r.getStatus())) return detail(r);
        var quantities=new TreeMap<UUID,Integer>(); r.getItems().forEach(i->quantities.put(UUID.fromString(i.getVariantId()),i.getQuantity()));
        if("OUT_OF_STOCK".equals(r.getType())) r.setHoldExpiresAt(Instant.now().plusSeconds(86400));
        else { var hold=product.customerHold(id,token,quantities);r.setHoldExpiresAt(Instant.parse(hold.get("expiresAt").toString())); }
        r.setStatus("AWAITING_DEPOSIT");
        r.setManagerId(manager); r.setBankInstructions(bankInstructions); reservations.save(r); return detail(r);
    }
    @Transactional
    public Detail cancel(UUID id,String user,boolean staff,String reason) {
        var r=locked(id); owner(r,user,staff);
        if("CANCELLED".equals(r.getStatus())) return detail(r);
        if(r.getPaid().signum()>0 || payments.existsByReservationIdAndStatus(id,"PENDING"))
            throw bad("Verified payments or unreviewed proof exist. Resolve payment/refund with the customer before cancellation");
        if(!Set.of("REQUESTED","AWAITING_DEPOSIT","EXPIRED").contains(r.getStatus())) throw bad("Reservation cannot be cancelled");
        if(reason==null || reason.isBlank() || reason.length()>1000) throw bad("A cancellation reason is required (maximum 1000 characters)");
        if(r.getHoldExpiresAt()!=null && !"OUT_OF_STOCK".equals(r.getType())) product.cancel(id,token);
        r.setStatus("CANCELLED"); r.setStockAction(null); r.setNote(reason.trim()); reservations.save(r); return detail(r);
    }
    @Transactional
    public Detail recordReceived(UUID id,String manager,ReceivedPayment input) {
        var r=locked(id);
        if(input.submissionId()==null) throw bad("Submission ID is required");
        var existing=payments.findById(input.submissionId());
        if(existing.isPresent()) {
            if(!id.equals(existing.get().getReservationId()) || !"MANAGER".equals(existing.get().getSource())) throw bad("Submission ID is already in use");
            return detail(r);
        }
        if(!Set.of("AWAITING_DEPOSIT","RESERVED").contains(r.getStatus())) throw bad("Reservation is not accepting received payments. Review any pending proof first.");
        if(payments.existsByReservationIdAndStatus(id,"PENDING")) throw bad("Review the customer's pending proof first to avoid recording the same transfer twice");
        var amount=money(input.amount());
        if(amount.compareTo(r.getTotal().subtract(r.getPaid()))>0) throw bad("Amount exceeds remaining balance");
        if(r.getPaid().signum()==0 && amount.compareTo(deposit(r))<0) throw bad("Initial payment must cover the selected deposit");
        String reference=input.reference()==null ? "" : input.reference().trim().toUpperCase(Locale.ROOT);
        if(!reference.matches("[A-Z0-9/-]{6,100}")) throw bad("Enter the transaction reference (6 to 100 letters, digits, / or -)");
        if(input.receivedAt()==null || input.receivedAt().isAfter(Instant.now()) || input.receivedAt().isBefore(r.getCreatedAt())) throw bad("Payment date must be between the request date and now");
        if(input.note()==null || input.note().isBlank() || input.note().length()>1000) throw bad("Record a verification note (maximum 1000 characters)");
        var p=new ReservationPayment();p.setId(input.submissionId());p.setReservationId(id);p.setReference(reference);
        p.setClaimedAmount(amount);p.setVerifiedAmount(amount);p.setStatus("VERIFIED");p.setSource("MANAGER");
        p.setReceivedAt(input.receivedAt());p.setReviewedAt(Instant.now());p.setReviewedBy(manager);p.setReviewNote(input.note().trim());
        payments.saveAndFlush(p);
        if(r.getPaid().signum()==0) {
            if(!r.getHoldExpiresAt().isAfter(Instant.now())) throw bad("Stock hold expired. Resolve availability before accepting this payment.");
            if(!"OUT_OF_STOCK".equals(r.getType())) product.review(id,token,true);
        }
        r.setPaid(r.getPaid().add(amount));r.setStatus(r.getPaid().compareTo(r.getTotal())==0 ? "FULLY_PAID" : "RESERVED");
        r.setStockAction("COMMIT");reservations.save(r);return detail(r);
    }
    @Transactional
    public Detail submit(UUID id,String user,Proof input) {
        var r=locked(id); owner(r,user,false);
        if(input.submissionId()==null) throw bad("Submission ID is required");
        var existing=payments.findById(input.submissionId());
        if(existing.isPresent()) {
            if(!id.equals(existing.get().getReservationId())) throw bad("Submission belongs to another reservation");
            return detail(r);
        }
        if(!Set.of("AWAITING_DEPOSIT","RESERVED").contains(r.getStatus())) throw bad("Reservation is not accepting payments");
        if(payments.existsByReservationIdAndStatus(id,"PENDING")) throw bad("Wait for the manager to review your previous payment");
        var amount=money(input.amount());
        if(amount.compareTo(r.getTotal().subtract(r.getPaid()))>0) throw bad("Amount exceeds the remaining balance");
        if(r.getPaid().signum()==0 && amount.compareTo(deposit(r))<0) throw bad("Initial payment must cover the selected deposit");
        String reference=input.reference()==null ? "" : input.reference().trim().toUpperCase(Locale.ROOT);
        if(!reference.matches("[A-Z0-9/-]{6,100}")) throw bad("Enter the bank transaction reference (6 to 100 letters, digits, / or -)");
        if(input.imageBase64()==null || input.imageBase64().length()>2800000) throw bad("Upload a PNG or JPEG screenshot under 2 MB");
        byte[] bytes;
        try { bytes=Base64.getDecoder().decode(input.imageBase64()); } catch(IllegalArgumentException e) { throw bad("Invalid screenshot"); }
        String mime=validateImage(bytes);
        var p=new ReservationPayment(); p.setId(input.submissionId()); p.setReservationId(id); p.setClaimedAmount(amount);
        p.setReference(reference); p.setProof(bytes); p.setProofType(mime); payments.saveAndFlush(p);
        if(r.getPaid().signum()==0) {
            if(!r.getHoldExpiresAt().isAfter(Instant.now())) throw bad("The payment window expired. Contact the manager if you already transferred money");
            if(!"OUT_OF_STOCK".equals(r.getType())) product.review(id,token,true);
            r.setStatus("PAYMENT_REVIEW"); r.setStockAction(null);
        }
        reservations.save(r); return detail(r);
    }
    static String validateImage(byte[] bytes) {
        if(bytes.length>2*1024*1024 || bytes.length<8) throw bad("Screenshot must be a PNG or JPEG under 2 MB");
        try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers=ImageIO.getImageReaders(stream);
            if(!readers.hasNext()) throw bad("Unsupported screenshot");
            var reader=readers.next();
            try {
                reader.setInput(stream); String format=reader.getFormatName().toLowerCase(Locale.ROOT);
                if(!Set.of("png","jpeg").contains(format) || reader.getWidth(0)>6000 || reader.getHeight(0)>6000)
                    throw bad("Use a PNG or JPEG with dimensions below 6000 pixels");
                return "jpeg".equals(format)?"image/jpeg":"image/png";
            } finally { reader.dispose(); }
        } catch(java.io.IOException e) { throw bad("Invalid screenshot"); }
    }
    @Transactional(readOnly=true)
    public ReservationPayment proof(UUID id,UUID paymentId,String user,boolean staff) {
        get(id,user,staff); var p=payments.findById(paymentId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        if(!id.equals(p.getReservationId()) || !p.isHasProof()) throw new ResponseStatusException(HttpStatus.NOT_FOUND); return p;
    }
    @Transactional
    public Detail review(UUID id,UUID paymentId,String manager,Review input) {
        var r=locked(id); var p=payments.findById(paymentId).orElseThrow(()->bad("Payment not found"));
        if(!id.equals(p.getReservationId())) throw bad("Payment does not belong to reservation");
        if(!"PENDING".equals(p.getStatus())) return detail(r);
        if(!Set.of("PAYMENT_REVIEW","RESERVED").contains(r.getStatus())) throw bad("Reservation is not open for review");
        if(input.note()==null || input.note().isBlank() || input.note().length()>1000) throw bad("Record the bank verification or rejection reason");
        if(input.approved()) {
            var amount=money(input.amount());
            if(amount.compareTo(r.getTotal().subtract(r.getPaid()))>0) throw bad("Verified amount exceeds balance");
            if(r.getPaid().signum()==0 && amount.compareTo(deposit(r))<0) throw bad("Verified initial payment is below the required deposit; resolve with customer before approval");
            r.setStockAction("COMMIT");
            p.setStatus("VERIFIED"); p.setVerifiedAmount(amount); r.setPaid(r.getPaid().add(amount)); r.setStatus("RESERVED");
            if(r.getPaid().compareTo(r.getTotal())==0) r.setStatus("FULLY_PAID");
        } else {
            p.setStatus("REJECTED");
            if(r.getPaid().signum()==0) {
                r.setStockAction("REVIEW_CLEAR");
                r.setStatus(r.getHoldExpiresAt().isAfter(Instant.now())?"AWAITING_DEPOSIT":"EXPIRED");
            }
        }
        p.setReviewedAt(Instant.now()); p.setReviewedBy(manager); p.setReviewNote(input.note().trim());
        payments.save(p); reservations.save(r); return detail(r);
    }
    private void createFulfillment(CustomerReservation r) {
        if(r.getOrderId()!=null) return;
        var order=new Orders(); order.setUserId(r.getUserId()); order.setAddressId(r.getAddressId());
        order.setOrderNumber(OrderNumbers.next(orders,"OUT_OF_STOCK".equals(r.getType()) ? "ORES" : "RES",java.time.LocalDate.now().getYear())); order.setPaymentMethod("BANK_TRANSFER"); order.setTotalAmount(r.getTotal());
        order.setOrderStatus(Orders.OrderStatus.CONFIRMED); order.setStockDeducted(true); order.setReservationManaged(false);
        order.setHandledByManagerId(r.getManagerId()); order.setIntegrationPending(true);
        if("OUT_OF_STOCK".equals(r.getType())) { order.setRemakeStatus("AWAITING_ASSIGNMENT");order.setReservationPaid(r.getPaid()); }
        for(var i:r.getItems()) {
            var item=new OrderItem(); item.setOrder(order); item.setProductId(i.getProductId()); item.setVariantId(i.getVariantId());
            item.setQuantity(i.getQuantity()); item.setSubtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())));
            item.setOrderType("READY_MADE"); item.setCurrentStatus(OrderItem.ItemStatus.PENDING); order.getItems().add(item);
        }
        r.setOrderId(orders.saveAndFlush(order).getId());
    }
    @Transactional
    public void syncStock(UUID id) {
        var r=locked(id);
        if("COMMIT".equals(r.getStockAction())) {
            if("OUT_OF_STOCK".equals(r.getType())) {
                createFulfillment(r);
                var order=orders.findForUpdate(r.getOrderId()).orElseThrow();
                order.setReservationPaid(r.getPaid());order.setIntegrationPending(true);orders.save(order);
            } else {
                product.commit(id,token);
                if(r.getPaid().compareTo(r.getTotal())==0) createFulfillment(r);
            }
        } else if("REVIEW_CLEAR".equals(r.getStockAction())) {
            if(!"OUT_OF_STOCK".equals(r.getType())) { product.review(id,token,false);
                if("EXPIRED".equals(r.getStatus())) product.release(id,token); }
        } else return;
        r.setStockAction(null); reservations.save(r);
    }
    @Transactional
    public void expire(UUID id) {
        var r=locked(id);
        if("AWAITING_DEPOSIT".equals(r.getStatus()) && !r.getHoldExpiresAt().isAfter(Instant.now())) {
            if(!"OUT_OF_STOCK".equals(r.getType())) product.release(id,token);
            r.setStatus("EXPIRED"); r.setStockAction(null); reservations.save(r);
        }
    }
}
