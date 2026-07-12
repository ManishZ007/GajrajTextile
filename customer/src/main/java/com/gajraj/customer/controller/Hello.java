package com.gajraj.customer.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
// this side only for testing purpose
@RestController
@RequestMapping("/hello")
public class Hello {

    @GetMapping("/customerHello")
    public String Hello() {
        return "Hello this is customer side";
    }

}


// this route is only for testing the token and other validation in service like service is running or not like this


