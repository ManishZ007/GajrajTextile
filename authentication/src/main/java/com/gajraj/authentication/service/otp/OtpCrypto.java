package com.gajraj.authentication.service.otp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@Component
public class OtpCrypto {
    private final String digestKey;
    private final String deliveryKey;
    private final SecureRandom random = new SecureRandom();
    public OtpCrypto(@Value("${customer.otp.digest-key:}") String digestKey,
                     @Value("${customer.otp.delivery-key:}") String deliveryKey) {
        this.digestKey = digestKey; this.deliveryKey = deliveryKey;
    }
    private byte[] key(String value) {
        byte[] key = Base64.getDecoder().decode(value);
        if (key.length != 32) throw new IllegalStateException("OTP key must contain 32 bytes");
        return key;
    }
    public void checkConfiguration() { key(digestKey); key(deliveryKey); }
    public String code() { return String.format(java.util.Locale.ROOT, "%06d", random.nextInt(1_000_000)); }
    public String digest(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key(digestKey), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException("OTP protection unavailable"); }
    }
    public Map<String, String> encrypt(String json, String eventId) {
        try {
            byte[] iv = new byte[12]; random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key(deliveryKey), "AES"), new GCMParameterSpec(128, iv));
            cipher.updateAAD(eventId.getBytes(StandardCharsets.UTF_8));
            return Map.of("eventId", eventId, "iv", Base64.getEncoder().encodeToString(iv),
                "ciphertext", Base64.getEncoder().encodeToString(cipher.doFinal(json.getBytes(StandardCharsets.UTF_8))));
        } catch (Exception e) { throw new IllegalStateException("OTP protection unavailable"); }
    }
}
