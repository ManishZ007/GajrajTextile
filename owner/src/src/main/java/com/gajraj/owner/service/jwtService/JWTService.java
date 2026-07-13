package com.gajraj.owner.service.jwtService;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
public class JWTService {

    private final PublicKey publicKey;

    public JWTService() throws Exception {
        this.publicKey = loadPublicKey("keys/public.pem");
    }

    private PublicKey loadPublicKey(String resourcePath) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new IllegalArgumentException("Public key resource not found: " + resourcePath);
            }
            String key = new String(is.readAllBytes());
            key = key.replaceAll("-----BEGIN (.*)-----", "")
                    .replaceAll("-----END (.*)-----", "")
                    .replaceAll("\\s+", "");
            byte[] keyBytes = Base64.getDecoder().decode(key);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePublic(spec);
        }
    }


    public Boolean validationToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        }catch (JwtException e) {
            return  false;
        }
    }


    public Jws<Claims> tokenClaims (String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token);
    }


    public String extractUserId(String token) {
        return tokenClaims(token).getBody().getSubject();
    }

    public String extractUserRole(String token) {
        return (String) tokenClaims(token).getBody().get("role");
    }

}

