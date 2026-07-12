package com.gajraj.product.repo;

import com.gajraj.product.model.ConfigAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface ConfigAssetRepo extends JpaRepository<ConfigAsset, UUID>, JpaSpecificationExecutor<ConfigAsset> {
    List<ConfigAsset> findByAssetTypeAndIsActiveTrue(ConfigAsset.AssetType assetType);
    List<ConfigAsset> findByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory category);
    List<ConfigAsset> findByAssetTypeAndCategoryAndIsActiveTrue(ConfigAsset.AssetType assetType, ConfigAsset.AssetCategory category);
    long countByAssetTypeAndIsActiveTrue(ConfigAsset.AssetType assetType);
    long countByCategoryAndIsActiveTrue(ConfigAsset.AssetCategory category);
    long countByIsActiveTrue();
}
