package com.gajraj.product.controller;

import com.gajraj.product.dto.ConfigAssetCreateDTO;
import com.gajraj.product.service.ConfigAssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/product/assets")
public class ConfigAssetController {

    @Autowired
    private ConfigAssetService configAssetService;

    @GetMapping("/all")
    public ResponseEntity<?> getAllAssets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String assetType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        try {
            return ResponseEntity.ok(configAssetService.getAllAssets(page, size, assetType, category, search));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{assetId}")
    public ResponseEntity<?> getAssetById(@PathVariable UUID assetId) {
        try {
            return ResponseEntity.ok(configAssetService.getAssetById(assetId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createAsset(@RequestBody ConfigAssetCreateDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(configAssetService.createAsset(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{assetId}")
    public ResponseEntity<?> updateAsset(@PathVariable UUID assetId, @RequestBody ConfigAssetCreateDTO dto) {
        try {
            return ResponseEntity.ok(configAssetService.updateAsset(assetId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{assetId}")
    public ResponseEntity<?> deleteAsset(@PathVariable UUID assetId) {
        try {
            return ResponseEntity.ok(configAssetService.deleteAsset(assetId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/upload-url")
    public ResponseEntity<?> getUploadUrl(
            @RequestParam String fileName,
            @RequestParam String assetType,
            @RequestParam String category) {
        try {
            return ResponseEntity.ok(configAssetService.getUploadUrl(fileName, assetType, category));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-category/{category}")
    public ResponseEntity<?> getAssetsByCategory(@PathVariable String category) {
        try {
            return ResponseEntity.ok(configAssetService.getAssetsByCategory(category));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getAssetStats() {
        try {
            // Reuse getAllAssets with page=0,size=1 to get counts, then extract stats
            var result = configAssetService.getAllAssets(0, 1, null, null, null);
            return ResponseEntity.ok(Map.of(
                    "total", result.getTotalAssets(),
                    "textures", result.getTextureCount(),
                    "models", result.getModelCount(),
                    "previews", result.getPreviewCount(),
                    "padar", result.getPadarCount(),
                    "kinar", result.getKinarCount(),
                    "butti", result.getButtiCount(),
                    "zari", result.getZariCount(),
                    "gond", result.getGondCount(),
                    "baseModel", result.getBaseModelCount()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
