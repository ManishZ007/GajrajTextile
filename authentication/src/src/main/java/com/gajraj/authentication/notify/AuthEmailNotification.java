package com.gajraj.authentication.notify;


import com.gajraj.authentication.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthEmailNotification {

    private RabbitTemplate rabbitTemplate;

    public AuthEmailNotification(RabbitTemplate rabbitTemplate){
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendRegistrationEmailToCustomer(String to, String name) {


            Map<String , Object> message  = new HashMap<>();
            message.put("to", to);
            message.put("subject", "Welcome to Gajraj Paithani");
            message.put("name", name);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    "email.register",
                    message
            );

            System.out.println("✅ sent registration email event to email notification service for customer");
    }


    public void sendRegistrationEmailToWorker(String to, String name) {
        Map<String , Object> message  = new HashMap<>();
        message.put("to", to);
        message.put("subject", "Welcome to Gajraj Paithani Happy to working with you sir");
        message.put("body", "Hello " + name + ", thanks to registration!");

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                "email.register",
                message
        );

        System.out.println("✅ sent registration email event to email notification service for worker");

    }


    public void sendRegistrationEmailToManager(String to, String name) {
        Map<String, Object> message = new HashMap<>();

        message.put("to", to);
        message.put("subject", "Welcome to Gajraj Paithani user application is selected for that know use are manager");
        message.put("body", "Hello " + name + ", thanks to registration!");

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                "email.register",
                message
        );

        System.out.println("✅ sent registration email event to email notification service for worker");
    }


}
