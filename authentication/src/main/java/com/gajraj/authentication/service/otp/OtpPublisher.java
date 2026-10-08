package com.gajraj.authentication.service.otp;

import com.gajraj.authentication.config.RabbitMQConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class OtpPublisher {
    private final RabbitTemplate rabbit;
    private final ObjectMapper json;
    private final OtpCrypto crypto;
    public OtpPublisher(ConnectionFactory factory, ObjectMapper json, OtpCrypto crypto) {
        this.rabbit = new RabbitTemplate(factory);
        rabbit.setMessageConverter(new org.springframework.amqp.support.converter.Jackson2JsonMessageConverter());
        rabbit.setMandatory(true);
        this.json = json; this.crypto = crypto;
    }
    public void publish(String id, String phone, String code, Instant expiresAt) {
        try {
            String body = json.writeValueAsString(Map.of("to", "+91"+phone, "code", code,
                "expiresAt", expiresAt.toEpochMilli(), "purpose", "CUSTOMER_LOGIN"));
            CorrelationData correlation = new CorrelationData(id);
            rabbit.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "sms.loginOtp", crypto.encrypt(body, id), message -> {
                message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                message.getMessageProperties().setMessageId(id);
                message.getMessageProperties().setExpiration(Long.toString(Math.max(1, expiresAt.toEpochMilli()-System.currentTimeMillis())));
                return message;
            }, correlation);
            var confirm = correlation.getFuture().get(4, TimeUnit.SECONDS);
            if (!confirm.isAck() || correlation.getReturned() != null) throw new IllegalStateException();
        } catch (Exception e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new IllegalStateException("OTP delivery could not be queued");
        }
    }
}
