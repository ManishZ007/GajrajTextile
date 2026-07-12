package com.gajraj.product.service;

import com.gajraj.product.dto.ConfigAssetCreateDTO;
import com.gajraj.product.dto.ConfigAssetListResponseDTO;
import com.gajraj.product.dto.ConfigAssetResponseDTO;
import com.gajraj.product.model.ConfigAsset;
import com.gajraj.product.repo.ConfigAssetRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ConfigAssetService {

    @Autowired
    private ConfigAssetRepo configAssetRepo;

    @Autowired
    private S3Service s3Service;

    @Transactional(readOnly = true)
    public ConfigAssetListResponseDTO getAllAssets(int page, int size, String assetType, String category, String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<ConfigAsset> spec = (root, query, cb) -> cb.isTrue(root.get("isActive"));

        if (assetType != null && !assetType.isBlank()) {
            ConfigAsset.AssetType type = ConfigAsset.AssetType.valueOf(assetType.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("assetType"), type));
        }
        if (category != null && !category.isBlank()) {
            ConfigAsset.AssetCategory cat = ConfigAsset.AssetCategory.valueOf(category.toUpperCase());
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), cat));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern));
        }

        Page<ConfigAsset> assetPage = configAssetRepo.findAll(spec, pageable);

        List<ConfigAssetResponseDTO> content = assetPage.getContent().stream()
                .map(this::toDTO)
                .toList();

        return new ConfigAssetListResponseDTO(
                content,
                assetPage.getTotalElements(),
                assetPage.getTotalPages(),
                page,
                size,
                configAssetRepo.countByIsActiveTrue(),
                configAssetRepo.countByAssetTypeAndIsActiveTrue(ConfigAsset.AssetType.TEXTURE),
                configAssetRepo.countByAssetTypeAndIsActiveTrue(ConfigAsset.AssetType.MODEL),
                configAssetRepo.countByAssetTypeAndIsActiveTrue(ConfigAsset.AssetType.PREVIEW),
                configAssetRepo.countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory.PADAR),
                configAssetRepo.countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory.KINAR),
                configAssetRepo.countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory.BUTTI),
                configAssetRepo.countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory.ZARI),
                configAssetRepo.countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory.GOND),
                configAssetRepo.countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory.BASE_MODEL)
        );
    }

    @Transactional(readOnly = true)
    public ConfigAssetResponseDTO getAssetById(UUID assetId) {
        ConfigAsset asset = configAssetRepo.findById(assetId)
                .orElseThrow(() -> new NoSuchElementException("Asset not found: " + assetId));
        return toDTO(asset);
    }

    @Transactional
    public ConfigAssetResponseDTO createAsset(ConfigAssetCreateDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (dto.getS3Key() == null || dto.getS3Key().isBlank()) {
            throw new IllegalArgumentException("s3Key is required");
        }

        ConfigAsset.AssetType assetType;
        try {
            assetType = ConfigAsset.AssetType.valueOf(dto.getAssetType().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid assetType: " + dto.getAssetType() + ". Must be TEXTURE, MODEL, or PREVIEW");
        }

        ConfigAsset.AssetCategory category;
        try {
            category = ConfigAsset.AssetCategory.valueOf(dto.getCategory().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid category: " + dto.getCategory() + ". Must be PADAR, KINAR, BUTTI, ZARI, GOND, BASE_MODEL, or OTHER");
        }

        ConfigAsset asset = new ConfigAsset();
        asset.setName(dto.getName());
        asset.setAssetType(assetType);
        asset.setCategory(category);
        asset.setS3Key(dto.getS3Key());
        asset.setFileExtension(dto.getFileExtension());
        asset.setFileSizeBytes(dto.getFileSizeBytes());
        asset.setDescription(dto.getDescription());
        asset.setIsActive(true);

        return toDTO(configAssetRepo.save(asset));
    }

    @Transactional
    public ConfigAssetResponseDTO updateAsset(UUID assetId, ConfigAssetCreateDTO dto) {
        ConfigAsset asset = configAssetRepo.findById(assetId)
                .orElseThrow(() -> new NoSuchElementException("Asset not found: " + assetId));

        if (dto.getName() != null && !dto.getName().isBlank()) {
            asset.setName(dto.getName());
        }
        if (dto.getAssetType() != null && !dto.getAssetType().isBlank()) {
            try {
                asset.setAssetType(ConfigAsset.AssetType.valueOf(dto.getAssetType().toUpperCase()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid assetType: " + dto.getAssetType());
            }
        }
        if (dto.getCategory() != null && !dto.getCategory().isBlank()) {
            try {
                asset.setCategory(ConfigAsset.AssetCategory.valueOf(dto.getCategory().toUpperCase()));
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid category: " + dto.getCategory());
            }
        }
        if (dto.getS3Key() != null && !dto.getS3Key().isBlank()) {
            asset.setS3Key(dto.getS3Key());
        }
        if (dto.getFileExtension() != null) {
            asset.setFileExtension(dto.getFileExtension());
        }
        if (dto.getFileSizeBytes() != null) {
            asset.setFileSizeBytes(dto.getFileSizeBytes());
        }
        if (dto.getDescription() != null) {
            asset.setDescription(dto.getDescription());
        }

        return toDTO(configAssetRepo.save(asset));
    }

    @Transactional
    public Map<String, String> deleteAsset(UUID assetId) {
        ConfigAsset asset = configAssetRepo.findById(assetId)
                .orElseThrow(() -> new NoSuchElementException("Asset not found: " + assetId));
        asset.setIsActive(false);
        configAssetRepo.save(asset);
        return Map.of("message", "Asset deactivated");
    }

    public Map<String, String> getUploadUrl(String fileName, String assetType, String category) {
        String prefix = "config-assets/" + category.toLowerCase() + "/" + assetType.toLowerCase();
        return s3Service.generateUploadUrl(prefix, fileName);
    }

    @Transactional(readOnly = true)
    public List<ConfigAssetResponseDTO> getAssetsByCategory(String category) {
        ConfigAsset.AssetCategory cat;
        try {
            cat = ConfigAsset.AssetCategory.valueOf(category.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid category: " + category);
        }
        return configAssetRepo.findByCategoryAndIsActiveTrue(cat).stream()
                .map(this::toDTO)
                .toList();
    }

    private ConfigAssetResponseDTO toDTO(ConfigAsset asset) {
        return new ConfigAssetResponseDTO(
                asset.getAssetId(),
                asset.getName(),
                asset.getAssetType().name(),
                asset.getCategory().name(),
                s3Service.generateViewUrl(asset.getS3Key()),
                asset.getS3Key(),
                asset.getFileExtension(),
                asset.getFileSizeBytes(),
                asset.getDescription(),
                asset.getIsActive(),
                asset.getCreatedAt()
        );
    }
}
