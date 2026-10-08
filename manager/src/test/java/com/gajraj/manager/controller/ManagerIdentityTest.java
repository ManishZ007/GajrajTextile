package com.gajraj.manager.controller;
import com.gajraj.manager.service.managerService.*;
import com.gajraj.manager.dto.priceChangeDTO.PriceChangeCreateDTO;
import com.gajraj.manager.dto.reportDTO.ReportCreateDTO;
import com.gajraj.manager.dto.supportDTO.SupportCaseCreateDTO;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.util.Map;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ManagerIdentityTest {
 @Test void submittedActorIdsCannotImpersonateAnotherManager() {
  var auth=new UsernamePasswordAuthenticationToken("signed-manager",null);
  var prices=mock(PriceChangeService.class);var pc=new PriceChangeController();ReflectionTestUtils.setField(pc,"priceChangeService",prices);
  var price=new PriceChangeCreateDTO();price.setUpdatedBy("forged");pc.createPriceChange(price,auth);assertEquals("signed-manager",price.getUpdatedBy());verify(prices).createPriceChange(price);
  var reports=mock(ReportsService.class);var rc=new ReportsController();ReflectionTestUtils.setField(rc,"reportsService",reports);
  var report=new ReportCreateDTO();report.setReportedBy("forged");rc.createReport(report,auth);assertEquals("signed-manager",report.getReportedBy());
  var support=mock(SupportCaseService.class);var sc=new SupportController();ReflectionTestUtils.setField(sc,"supportCaseService",support);
  var ticket=new SupportCaseCreateDTO();ticket.setHandledBy("forged");sc.createCase(ticket,auth);assertEquals("signed-manager",ticket.getHandledBy());
  var flows=mock(OrderFlowService.class);var fc=new OrderFlowController();ReflectionTestUtils.setField(fc,"orderFlowService",flows);
  fc.startProduction("order",Map.of("handledBy","forged"),auth);verify(flows).startProduction("order","signed-manager");
 }
}
