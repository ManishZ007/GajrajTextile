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

    public void sendRegistrationEmail(String to, String name, String role) {


            Map<String , Object> message  = new HashMap<>();
            message.put("to", to);
            message.put("subject", "Welcome to Gajraj Paithani");
            message.put("name", name);
            message.put("role", role);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    "email.register",
                    message
            );

            System.out.println("✅ registration email is send to the notification service");
    }




}
