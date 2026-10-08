package com.gajraj.authentication.controller;
import com.gajraj.authentication.service.AdminPresence;
import com.gajraj.authentication.repo.RefreshTokenRepo;
import com.gajraj.authentication.repo.UserRepo;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@RestController
public class AdminSessionController {
    private final AdminPresence presence;
    private final RefreshTokenRepo tokens;
    private final UserRepo users;
    public AdminSessionController(AdminPresence presence, RefreshTokenRepo tokens, UserRepo users) {
        this.presence=presence;this.tokens=tokens;this.users=users;
    }
    @PostMapping("/auth/admin/session/heartbeat")
    public Map<String,Object> heartbeat(Authentication auth) {
        var user=users.findById(UUID.fromString(auth.getName())).orElseThrow();
        if (tokens.findByUserId(user.getUser_id()) == null)
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);
        presence.touch(auth.getName());
        return Map.of("role",user.getRole().name(),"user_id",auth.getName());
    }
    @PostMapping("/auth/admin/logout")
    @Transactional
    public ResponseEntity<?> logout(Authentication auth) {
        tokens.deleteForPasswordReset(UUID.fromString(auth.getName()));
        presence.leave(auth.getName());
        var response=ResponseEntity.ok().header("Cache-Control","no-store");
        for (String name:List.of("access_token","refresh_token"))
            response.header("Set-Cookie",ResponseCookie.from(name,"").httpOnly(true).secure(true).path("/").sameSite("Strict").maxAge(0).build().toString());
        return response.body(Map.of("message","Signed out"));
    }
    @GetMapping("/auth/managers/{id}/presence")
    public Map<String,Object> presence(@PathVariable UUID id) { return presence.read(id.toString()); }
}
