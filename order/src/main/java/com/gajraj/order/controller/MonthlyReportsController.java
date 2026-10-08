package com.gajraj.order.controller;
import com.gajraj.order.repo.*;
import com.gajraj.order.service.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import java.time.*;
import java.util.*;
@RestController
@RequestMapping("/manager/orders/reports")
public class MonthlyReportsController {
 private final OrdersRepo orders; private final DealerOrderRepo dealers; private final OrdersService orderService; private final DealerOrderService dealerService;
 public MonthlyReportsController(OrdersRepo orders,DealerOrderRepo dealers,OrdersService orderService,DealerOrderService dealerService){this.orders=orders;this.dealers=dealers;this.orderService=orderService;this.dealerService=dealerService;}
 @GetMapping("/{type}") @Transactional(readOnly=true)
 public Map<String,Object> report(@PathVariable String type,@RequestParam String month,@RequestParam(defaultValue="0") int page){
  YearMonth selected;
  try{selected=YearMonth.parse(month);}catch(Exception e){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid month");}
  var current=YearMonth.now(ZoneId.of("Asia/Kolkata"));
  if(selected.isAfter(current)||selected.isBefore(current.minusMonths(5))||page<0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose one of the last six months");
  var start=selected.atDay(1).atStartOfDay();var end=selected.plusMonths(1).atDay(1).atStartOfDay();var paging=PageRequest.of(page,100);
  if(type.equals("customer")){
   var rows=orders.findByOrderDateGreaterThanEqualAndOrderDateLessThanOrderByOrderDateDesc(start,end,paging);
   return Map.of("content",rows.getContent().stream().map(o->orderService.getOrderById(o.getId())).toList(),"totalPages",rows.getTotalPages(),"totalElements",rows.getTotalElements());
  }
  if(type.equals("dealer")){
   var rows=dealers.findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(start,end,paging);
   return Map.of("content",rows.getContent().stream().map(o->dealerService.getOrderById(o.getId())).toList(),"totalPages",rows.getTotalPages(),"totalElements",rows.getTotalElements());
  }
  throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid report type");
 }
}
