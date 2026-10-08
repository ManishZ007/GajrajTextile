package com.gajraj.order.controller;
import org.junit.jupiter.api.Test;
import com.gajraj.order.repo.*;
import com.gajraj.order.service.*;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class MonthlyReportsTest {
 @Test void boundsAndSeparateMonthlyQueries(){
  var orders=mock(OrdersRepo.class);var dealers=mock(DealerOrderRepo.class);
  var controller=new MonthlyReportsController(orders,dealers,mock(OrdersService.class),mock(DealerOrderService.class));
  var current=YearMonth.now(ZoneId.of("Asia/Kolkata"));var selected=current.minusMonths(2);var start=selected.atDay(1).atStartOfDay();var end=selected.plusMonths(1).atDay(1).atStartOfDay();
  when(orders.findByOrderDateGreaterThanEqualAndOrderDateLessThanOrderByOrderDateDesc(eq(start),eq(end),any())).thenReturn(Page.empty());
  assertEquals(0L,controller.report("customer",selected.toString(),0).get("totalElements"));
  verifyNoInteractions(dealers);
  assertThrows(ResponseStatusException.class,()->controller.report("customer",current.minusMonths(6).toString(),0));
  assertThrows(ResponseStatusException.class,()->controller.report("customer",current.plusMonths(1).toString(),0));
  assertThrows(ResponseStatusException.class,()->controller.report("customer","invalid",0));
 }
}
