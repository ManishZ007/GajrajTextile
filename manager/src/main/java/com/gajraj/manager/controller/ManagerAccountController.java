package com.gajraj.manager.controller;
import com.gajraj.manager.repo.ManagerRepo;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
@RestController
public class ManagerAccountController {
    private final ManagerRepo managers;
    public ManagerAccountController(ManagerRepo managers) {this.managers=managers;}
    @GetMapping("/manager/account/{id}/status")
    public Map<String,Object> status(@PathVariable UUID id,Authentication auth) {
        if(auth==null || (!id.toString().equals(auth.getName()) && auth.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_OWNER"))))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        var manager=managers.findManagerByUserId(id.toString());
        if(manager==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return Map.of("enabled",manager.getStatus()!=com.gajraj.manager.model.Managers.ManagerStatus.INACTIVE);
    }
}
