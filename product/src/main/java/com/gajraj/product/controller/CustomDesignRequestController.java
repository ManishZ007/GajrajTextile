package com.gajraj.product.controller;
import com.gajraj.product.service.CustomDesignRequestService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController @RequestMapping("/product/design-requests")
public class CustomDesignRequestController {
    private final CustomDesignRequestService service;
    public CustomDesignRequestController(CustomDesignRequestService service){this.service=service;}
    private boolean staff(Authentication a){return a.getAuthorities().stream().anyMatch(x->Set.of("ROLE_MANAGER","ROLE_OWNER").contains(x.getAuthority()));}
    @GetMapping public Object list(Authentication a,@RequestParam(defaultValue="0")int page){return service.list(a.getName(),staff(a),page);}
    @GetMapping("/{id}") public Object detail(Authentication a,@PathVariable UUID id){return service.detail(id,a.getName(),staff(a));}
    @PostMapping public Object submit(Authentication a,@RequestBody CustomDesignRequestService.Submit body){
        if(staff(a))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Customer sign-in required");
        return service.submit(body,a.getName());
    }
    @PutMapping("/{id}/quote") public Object quote(Authentication a,@PathVariable UUID id,@RequestBody CustomDesignRequestService.Quote body){
        if(!staff(a))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Staff access required");
        return service.quote(id,body,a.getName());
    }
    @ExceptionHandler(ResponseStatusException.class) public ResponseEntity<?> error(ResponseStatusException e){
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("error",Objects.toString(e.getReason(),"Unable to process design")));
    }
    @ExceptionHandler({org.springframework.dao.OptimisticLockingFailureException.class,org.springframework.dao.DataIntegrityViolationException.class})
    public ResponseEntity<?> conflict(Exception e){return ResponseEntity.status(409).body(Map.of("error","The request changed. Refresh and check its latest status before retrying."));}
}
