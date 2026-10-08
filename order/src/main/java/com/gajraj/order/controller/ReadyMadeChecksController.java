package com.gajraj.order.controller;
import com.gajraj.order.service.ReadyMadeChecksService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/manager/orders/checks")
public class ReadyMadeChecksController {
    private final ReadyMadeChecksService checks;
    public ReadyMadeChecksController(ReadyMadeChecksService checks) { this.checks = checks; }
    @GetMapping public Object list(@RequestParam(defaultValue = "quality") String view,
        @RequestParam(required = false) String quality, @RequestParam(defaultValue = "0") int page) {
        return checks.list(view, quality, page);
    }
    @GetMapping("/{id}/history") public Object history(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
        return checks.history(id, page);
    }
    public record Action(String action, String note) {}
    @PostMapping("/{id}") public ResponseEntity<Void> act(@PathVariable UUID id, @RequestBody Action body, Principal principal) {
        checks.act(id, body.action(), body.note(), principal.getName());
        return ResponseEntity.noContent().build();
    }
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<?> invalid(RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
}
