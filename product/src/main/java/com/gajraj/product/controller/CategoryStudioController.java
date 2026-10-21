package com.gajraj.product.controller;
import com.gajraj.product.service.CategoryStudioService;
import com.gajraj.product.dto.StudioMapping;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/product/categories/{categoryId}/studio")
public class CategoryStudioController {
    private final CategoryStudioService service;
    public CategoryStudioController(CategoryStudioService service){this.service=service;}
    @GetMapping public Map<String,Object> get(@PathVariable UUID categoryId){return service.get(categoryId);}
    @PutMapping public Map<String,String> save(@PathVariable UUID categoryId,@RequestBody StudioMapping body){
        service.save(categoryId,body);return Map.of("message","Model mapping saved");
    }
}
