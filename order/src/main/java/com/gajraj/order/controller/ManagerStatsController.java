package com.gajraj.order.controller;
import com.gajraj.order.model.*;
import com.gajraj.order.repo.*;
import com.gajraj.order.service.DealerService;
import com.gajraj.order.feign.PaymentServiceClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.*;
@RestController
@RequestMapping("/internal/manager-stats")
public class ManagerStatsController {
    @Autowired DealerOrderRepo dealerOrderRepo;
    @Autowired DealerRepo dealerRepo;
    @Autowired DealerService dealerService;
    @Autowired OrdersRepo ordersRepo;
    @Autowired PaymentServiceClient payments;
    public record Row(String id, String type, String number, String party, String status,
                      BigDecimal amount, BigDecimal collected, String date, boolean includedInFinancials) {}
    static BigDecimal money(BigDecimal amount) { return amount==null ? BigDecimal.ZERO : amount; }
    public static boolean active(String status) { return !Set.of("DRAFT","CANCELLED","DELIVERED","COMPLETED").contains(status); }
    @GetMapping("/{managerId}")
    @Transactional(readOnly=true)
    public Map<String,Object> getStats(@PathVariable UUID managerId, @RequestHeader("Authorization") String authorization) {
        String id=managerId.toString();
        var bulk=dealerOrderRepo.findByCreatedByManagerIdOrderByCreatedAtDesc(id,org.springframework.data.domain.Pageable.unpaged()).getContent();
        var retail=ordersRepo.findByHandledByManagerIdOrderByOrderDateDesc(id,org.springframework.data.domain.Pageable.unpaged()).getContent();
        var paid=new HashMap<String,PaymentServiceClient.PaymentSummary>();
        boolean financialAvailable=true;
        var online=retail.stream().filter(o->!"COD".equals(o.getPaymentMethod()) && o.getOrderStatus()!=Orders.OrderStatus.CANCELLED).map(Orders::getId).toList();
        try {
            for(int i=0;i<online.size();i+=500) paid.putAll(payments.summaries(authorization,online.subList(i,Math.min(i+500,online.size()))));
        } catch (RuntimeException e) { financialAvailable=false; }
        var rows=new ArrayList<Row>();
        for(var o:bulk) {
            String status=o.getStatus()==null ? "DRAFT" : o.getStatus().name();
            rows.add(new Row(o.getId().toString(),"dealer",o.getOrderNumber(),o.getDealer()==null?"":o.getDealer().getName(),
                status,money(o.getTotalAmount()),money(o.getPaidAmount()),Objects.toString(o.getCreatedAt(),""),
                !Set.of("DRAFT","CANCELLED").contains(status)));
        }
        for(var o:retail) {
            String status=o.getOrderStatus()==null?"PENDING":o.getOrderStatus().name();
            BigDecimal collected=null;
            if ("COD".equals(o.getPaymentMethod())) collected=Boolean.TRUE.equals(o.getCodCollected())?money(o.getTotalAmount()):BigDecimal.ZERO;
            else {
                var payment=paid.get(o.getId().toString());
                if(payment!=null && payment.status()!=null) collected="PAID".equals(payment.status())?money(payment.amount()):BigDecimal.ZERO;
                else if (!"CANCELLED".equals(status)) financialAvailable=false;
            }
            rows.add(new Row(o.getId().toString(),"customer",o.getOrderNumber(),o.getUserId(),status,
                money(o.getTotalAmount()),collected,Objects.toString(o.getOrderDate(),""),!"CANCELLED".equals(status)));
        }
        rows.sort(Comparator.comparing(Row::date).reversed());
        var response=new LinkedHashMap<String,Object>();
        response.put("managerId",id);response.put("totalDealerOrders",bulk.size());response.put("totalCustomerOrders",retail.size());
        response.put("totalDealers",dealerRepo.countByCreatedByManagerId(id));
        response.put("activeOrders",rows.stream().filter(r->active(r.status())).count());
        response.put("deliveredOrders",rows.stream().filter(r->"DELIVERED".equals(r.status())).count());
        var included=rows.stream().filter(Row::includedInFinancials).toList();
        BigDecimal total=included.stream().map(Row::amount).reduce(BigDecimal.ZERO,BigDecimal::add);
        BigDecimal collected=included.stream().map(r->money(r.collected())).reduce(BigDecimal.ZERO,BigDecimal::add);
        BigDecimal balance=included.stream().map(r->r.amount().subtract(money(r.collected())).max(BigDecimal.ZERO)).reduce(BigDecimal.ZERO,BigDecimal::add);
        response.put("totalOrderValue",total);
        response.put("totalCollected",financialAvailable?collected:null);
        response.put("totalBalance",financialAvailable?balance:null);
        response.put("financialAvailable",financialAvailable);
        response.put("orders",rows);
        response.put("recentDealerOrders",List.of());
        return response;
    }
    @GetMapping("/{managerId}/dealers")
    public Object getDealersByManager(@PathVariable UUID managerId) {
        return dealerService.getDealersByManager(managerId.toString());
    }
}
