package com.gajraj.payment.service;
import com.razorpay.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.List;
@Component
public class PaymentGateway {
    @Value("${razorpay.key.id}") private String key;
    @Value("${razorpay.key.secret}") private String secret;
    public record Details(String id, String orderId, String status, long amount, String currency) {}
    public String create(String receipt, long amount) throws RazorpayException {
        return new RazorpayClient(key,secret).orders.create(new JSONObject()
                .put("receipt",receipt).put("amount",amount).put("currency","INR")).get("id");
    }
    public List<Details> payments(String id) throws RazorpayException {
        return new RazorpayClient(key,secret).orders.fetchPayments(id).stream().map(p ->
                new Details(p.get("id"),p.get("order_id"),p.get("status"),
                        ((Number)p.get("amount")).longValue(),p.get("currency"))).toList();
    }
}
