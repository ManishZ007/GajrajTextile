package com.gajraj.authentication.controller;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/hello")
public class HelloController {

    @GetMapping("/getHello")
    public ResponseEntity<?> getHello(){
        return  ResponseEntity.ok(Map.of("message", "hello minal"));
    }

    @GetMapping("/doHello")
    public ResponseEntity<?> doHello(){
        return  ResponseEntity.ok(Map.of("message", "hello manish"));
    }
}
