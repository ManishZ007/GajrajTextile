package com.gajraj.authentication.service.jwtService;


import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

@Service
public class JWTService {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;

    @Value("${jwt.expiration}")
    private long expiration;

    public JWTService() throws Exception{
        this.privateKey =  loadPrivateKey("keys/private.pem");
        this.publicKey = loadPublicKey("keys/public.pem");
    }


    private PrivateKey loadPrivateKey(String resourcePath) throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new IllegalArgumentException("Private key resource not found: " + resourcePath);
            }
            String key = new String(is.readAllBytes());
            key = key.replaceAll("-----BEGIN (.*)-----", "")
                    .replaceAll("-----END (.*)-----", "")
                    .replaceAll("\\s+", "");
            byte[] keyBytes = Base64.getDecoder().decode(key);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            return KeyFactory.getInstance("RSA").generatePrivate(spec);
        }
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


    public String generateToken( String userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userId)
                .addClaims(Map.of("role", role))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(expiration)))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }


    public Boolean validationToken (String token) {
        try{Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token);
            return true;
        }catch (JwtException e) {
            return false;
        }

    }


    public Jws<Claims> tokenClaims (String token) {
        return Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token);
    }

    public String extractUserId (String token) {
        return tokenClaims(token).getBody().getSubject();
    }

    public String extractUserRole (String token) {
        return (String) tokenClaims(token).getBody().get("role");
    }

}
