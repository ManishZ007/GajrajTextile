package com.gajraj.manager.config;
import com.gajraj.manager.repo.*;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.UUID;
@Component
public class ManagerRecordAccess {
    private final OwnerReportsRepo reports;
    private final ProductPriceUpdatedRepo prices;
    public ManagerRecordAccess(OwnerReportsRepo reports, ProductPriceUpdatedRepo prices) {this.reports=reports;this.prices=prices;}
    public void report(UUID id, Authentication auth) {
        var record=reports.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        check(record.getReportedBy(), auth);
    }
    public void price(UUID id, Authentication auth) {
        var record=prices.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));
        check(record.getUpdatedBy(), auth);
    }
    private void check(String creator, Authentication auth) {
        if (!auth.getName().equals(creator) && auth.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_OWNER")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
