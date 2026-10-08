package com.gajraj.authentication.config;


import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME =  "notification_exchange";


    @Bean
    public TopicExchange notificationExchange(){
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    // Declare the destination with the producer, so registration is queued even when
    // the notification process has not been started yet.
    @Bean
    public Queue notificationMailQueue() {
        return new Queue("mail_queue", true);
    }

    @Bean
    public Binding notificationMailBinding(Queue notificationMailQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(notificationMailQueue).to(notificationExchange).with("email.#");
    }

    @Bean
    public Queue notificationSmsQueue() {
        return new Queue("sms_queue", true);
    }

    @Bean
    public Binding notificationSmsBinding(Queue notificationSmsQueue, TopicExchange notificationExchange) {
        return BindingBuilder.bind(notificationSmsQueue).to(notificationExchange).with("sms.loginOtp");
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate (ConnectionFactory connectionFactory, Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }
}
