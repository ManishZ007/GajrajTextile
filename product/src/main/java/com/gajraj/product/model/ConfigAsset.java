package com.gajraj.product.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "config_assets")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConfigAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "asset_id")
    private UUID assetId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 20)
    private AssetType assetType;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private AssetCategory category;

    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    @Column(name = "file_extension", length = 10)
    private String fileExtension;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AssetType {
        TEXTURE, MODEL, PREVIEW
    }

    public enum AssetCategory {
        PADAR, KINAR, BUTTI, ZARI, GOND, BASE_MODEL, OTHER
    }
}
