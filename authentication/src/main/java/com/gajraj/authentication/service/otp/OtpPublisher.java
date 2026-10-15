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
    @org.springframework.beans.factory.annotation.Value("${NOTIFICATION_SERVICE_URL:http://localhost:4000}")
    private String notificationUrl;
    public OtpPublisher(ConnectionFactory factory, ObjectMapper json, OtpCrypto crypto) {
        this.rabbit = new RabbitTemplate(factory);
        rabbit.setMessageConverter(new org.springframework.amqp.support.converter.Jackson2JsonMessageConverter());
        rabbit.setMandatory(true);
        this.json = json; this.crypto = crypto;
    }
    public void publish(String id, String phone, String code, Instant expiresAt) {
        try {
            // A broker acknowledgement alone does not mean an SMS consumer is available.
            var client = java.net.http.HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(2)).build();
            var health = client.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(notificationUrl + "/health/sms"))
                .timeout(java.time.Duration.ofSeconds(3)).GET().build(), java.net.http.HttpResponse.BodyHandlers.ofString());
            if (health.statusCode() != 200 || !json.readTree(health.body()).path("ready").asBoolean(false))
                throw new IllegalStateException("SMS consumer unavailable");
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
