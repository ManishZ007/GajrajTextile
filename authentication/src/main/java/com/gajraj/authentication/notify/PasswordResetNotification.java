package com.gajraj.authentication.notify;

import com.gajraj.authentication.config.RabbitMQConfig;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class PasswordResetNotification {
    private final RabbitTemplate rabbit;
    public PasswordResetNotification(ConnectionFactory factory) {
        rabbit = new RabbitTemplate(factory);
        rabbit.setMessageConverter(new org.springframework.amqp.support.converter.Jackson2JsonMessageConverter());
        rabbit.setMandatory(true);
    }
    public void send(String email, String name, String resetUrl) {
        try {
            var correlation = new CorrelationData(UUID.randomUUID().toString());
            rabbit.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "email.passwordReset",
                Map.of("to", email, "name", name == null ? "there" : name,
                    "resetUrl", resetUrl, "expiresAt", Instant.now().plusSeconds(900).toEpochMilli()),
                message -> {
                    message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    message.getMessageProperties().setExpiration("900000");
                    return message;
                }, correlation);
            var confirm = correlation.getFuture().get(4, TimeUnit.SECONDS);
            if (!confirm.isAck() || correlation.getReturned() != null) throw new IllegalStateException();
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new IllegalStateException("Password reset email could not be queued");
        }
    }
}
