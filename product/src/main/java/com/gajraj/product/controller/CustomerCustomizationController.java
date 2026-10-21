package com.gajraj.product.controller;

import com.gajraj.product.service.CustomerCustomizationService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/product/customization")
public class CustomerCustomizationController {
    private final CustomerCustomizationService service;
    public CustomerCustomizationController(CustomerCustomizationService service){this.service=service;}
    @GetMapping("/catalog") public Object catalog(@RequestParam(defaultValue="0") int page){return service.catalog(page);}
    @GetMapping("/{productId}") public Object configuration(@PathVariable UUID productId){return service.configuration(productId);}
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException e){
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("error",Objects.toString(e.getReason(),"Customization is unavailable")));
    }
}
