package com.gajraj.manager.config;
import com.gajraj.manager.repo.*;
import com.gajraj.manager.model.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class ManagerRecordAccessTest {
 @Test void anotherManagerCannotEditOrDeleteRecords() {
  var reports=mock(OwnerReportsRepo.class); var prices=mock(ProductPriceUpdatedRepo.class);
  var id=UUID.randomUUID(); var report=new OwnerReports(); report.setReportedBy("creator");
  var price=new ProductPriceUpdates(); price.setUpdatedBy("creator");
  when(reports.findById(id)).thenReturn(Optional.of(report));when(prices.findById(id)).thenReturn(Optional.of(price));
  var access=new ManagerRecordAccess(reports,prices);
  var other=new UsernamePasswordAuthenticationToken("other",null,List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
  assertEquals(403,assertThrows(ResponseStatusException.class,()->access.report(id,other)).getStatusCode().value());
  assertEquals(403,assertThrows(ResponseStatusException.class,()->access.price(id,other)).getStatusCode().value());
  var creator=new UsernamePasswordAuthenticationToken("creator",null,List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
  access.report(id,creator);access.price(id,creator);
  var owner=new UsernamePasswordAuthenticationToken("owner",null,List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
  access.report(id,owner);access.price(id,owner);
 }
}
