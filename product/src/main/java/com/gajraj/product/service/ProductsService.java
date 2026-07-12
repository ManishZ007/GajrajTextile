package com.gajraj.product.service;

import com.gajraj.product.dto.ProductCreateRequestDTO;
import com.gajraj.product.dto.ProductDetailDTO;
import com.gajraj.product.dto.ProductListResponseDTO;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class ProductsService {

    @Autowired
    private ProductsRepo productsRepo;

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Autowired
    private ProductVariantsRepo productVariantsRepo;

    @Autowired
    private ProductImagesRepo productImagesRepo;

    @Autowired
    private ProductAttributesRepo productAttributesRepo;

    @Autowired
    private PadarRepo padarRepo;

    @Autowired
    private BorderRepo borderRepo;

    @Autowired
    private ButtiRepo buttiRepo;

    @Autowired
    private BodyColorRepo bodyColorRepo;

    @Autowired
    private BorderColorRepo borderColorRepo;

    @Autowired
    private S3Service s3Service;

    @Transactional
    public Products createProduct(ProductCreateRequestDTO dto) {
        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + dto.getCategoryId()));

        Products product = new Products();
        product.setCategory(category);
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setBasePrice(dto.getBasePrice());
        product.setStatus(dto.getStatus());
        Products saved = productsRepo.save(product);

        if (dto.getVariants() != null) {
            for (ProductCreateRequestDTO.VariantRequest v : dto.getVariants()) {
                ProductVariants variant = new ProductVariants();
                variant.setProduct(saved);
                variant.setSize(v.getSize());
                variant.setColor(v.getColor());
                variant.setPrice(v.getPrice());
                variant.setStockQuantity(v.getStockQuantity());
                variant.setSku(v.getSku());
                variant.setStatus(v.getStatus());
                productVariantsRepo.save(variant);
            }
        }

        if (dto.getAttributes() != null) {
            for (ProductCreateRequestDTO.AttributeRequest a : dto.getAttributes()) {
                ProductAttributes attribute = new ProductAttributes();
                attribute.setProduct(saved);
                attribute.setAttributeKey(a.getAttributeKey());
                attribute.setAttributeValue(a.getAttributeValue());
                productAttributesRepo.save(attribute);
            }
        }

        if (dto.getImages() != null) {
            for (ProductCreateRequestDTO.ImageRequest i : dto.getImages()) {
                ProductImages image = new ProductImages();
                image.setProduct(saved);
                image.setImageUrl(i.getImageUrl());
                image.setIsPrimary(i.getIsPrimary());
                image.setDisplayOrder(i.getDisplayOrder());
                productImagesRepo.save(image);
            }
        }

        if (Boolean.TRUE.equals(category.getCustomizable())) {
            List<Padar> padars = padarRepo.findByCategoryCategoryId(category.getCategoryId());
            if (!padars.isEmpty()) saved.setDefaultPadarId(padars.get(0).getPadarId());

            List<Border> borders = borderRepo.findByCategoryCategoryId(category.getCategoryId());
            if (!borders.isEmpty()) saved.setDefaultBorderId(borders.get(0).getBorderId());

            List<Butti> buttis = buttiRepo.findByCategoryCategoryId(category.getCategoryId());
            if (!buttis.isEmpty()) saved.setDefaultButtiId(buttis.get(0).getButtiId());

            List<BodyColor> bodyColors = bodyColorRepo.findByCategoryCategoryId(category.getCategoryId());
            if (!bodyColors.isEmpty()) saved.setDefaultBodyColorId(bodyColors.get(0).getBodyColorId());

            List<BorderColor> borderColors = borderColorRepo.findByCategoryCategoryId(category.getCategoryId());
            if (!borderColors.isEmpty()) saved.setDefaultBorderColorId(borderColors.get(0).getBorderColorId());

            saved = productsRepo.save(saved);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public ProductListResponseDTO getAllProducts(int page, int size, String status, String search, UUID categoryId, boolean includeArchived) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Products> spec = (root, query, cb) -> cb.conjunction();
        if (!includeArchived && (status == null || status.isBlank())) {
            spec = spec.and((root, query, cb) -> cb.notEqual(root.get("status"), "ARCHIVED"));
        }
        if (status != null && !status.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern));
        }
        if (categoryId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category").get("categoryId"), categoryId));
        }

        Page<Products> productPage = productsRepo.findAll(spec, pageable);

        Map<UUID, ProductListResponseDTO.CustomOptions> categoryOptionsCache = new HashMap<>();

        List<ProductListResponseDTO.ProductSummary> summaries = productPage.getContent().stream()
                .map(p -> {
                    int variantCount = productVariantsRepo.countByProduct(p);
                    int totalStock = productVariantsRepo.sumStockByProduct(p);
                    String primaryImage = productImagesRepo.findByProductAndIsPrimaryTrue(p)
                            .map(img -> s3Service.generateViewUrl(img.getImageUrl()))
                            .orElse(null);
                    String categoryBaseImageUrl = p.getCategory().getBaseImage() != null
                            ? s3Service.generateViewUrl(p.getCategory().getBaseImage()) : null;
                    ProductListResponseDTO.CategorySummary categorySummary = new ProductListResponseDTO.CategorySummary(
                            p.getCategory().getCategoryId(),
                            p.getCategory().getName(),
                            categoryBaseImageUrl,
                            p.getCategory().getBaseTitle(),
                            p.getCategory().getBaseShortDescription(),
                            p.getCategory().getBaseDescription()
                    );

                    Boolean isCustomizable = p.getCategory().getCustomizable();
                    ProductListResponseDTO.CustomOptions customOptions = null;

                    if (Boolean.TRUE.equals(isCustomizable)) {
                        UUID catId = p.getCategory().getCategoryId();
                        customOptions = categoryOptionsCache.computeIfAbsent(catId, id -> {
                            List<ProductListResponseDTO.CustomOptionItem> padars = padarRepo.findByCategoryCategoryId(id).stream()
                                    .map(x -> new ProductListResponseDTO.CustomOptionItem(x.getPadarId(), x.getPadarName(), x.getModelUrl()))
                                    .toList();
                            List<ProductListResponseDTO.CustomOptionItem> borders = borderRepo.findByCategoryCategoryId(id).stream()
                                    .map(x -> new ProductListResponseDTO.CustomOptionItem(x.getBorderId(), x.getBorderName(), x.getModelUrl()))
                                    .toList();
                            List<ProductListResponseDTO.CustomOptionItem> buttis = buttiRepo.findByCategoryCategoryId(id).stream()
                                    .map(x -> new ProductListResponseDTO.CustomOptionItem(x.getButtiId(), x.getButtiName(), x.getModelUrl()))
                                    .toList();
                            List<ProductListResponseDTO.ColorOptionItem> bodyColors = bodyColorRepo.findByCategoryCategoryId(id).stream()
                                    .map(x -> new ProductListResponseDTO.ColorOptionItem(x.getBodyColorId(), x.getColorName(), x.getHexCode()))
                                    .toList();
                            List<ProductListResponseDTO.ColorOptionItem> borderColors = borderColorRepo.findByCategoryCategoryId(id).stream()
                                    .map(x -> new ProductListResponseDTO.ColorOptionItem(x.getBorderColorId(), x.getColorName(), x.getHexCode()))
                                    .toList();
                            return new ProductListResponseDTO.CustomOptions(padars, borders, buttis, bodyColors, borderColors);
                        });
                    }

                    return new ProductListResponseDTO.ProductSummary(
                            p.getProductId(),
                            p.getName(),
                            p.getDescription(),
                            categorySummary,
                            p.getBasePrice(),
                            p.getStatus(),
                            variantCount,
                            totalStock,
                            primaryImage,
                            p.getCreatedAt(),
                            isCustomizable,
                            customOptions
                    );
                })
                .toList();

        return new ProductListResponseDTO(
                summaries,
                productPage.getTotalElements(),
                productPage.getTotalPages(),
                page,
                size
        );
    }

    @Transactional
    public ProductListResponseDTO.ProductSummary updateProduct(UUID productId, ProductCreateRequestDTO dto) {
        Products product = productsRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + dto.getCategoryId()));

        product.setName(dto.getName());
        product.setCategory(category);
        product.setBasePrice(dto.getBasePrice());
        product.setDescription(dto.getDescription());
        product.setStatus(dto.getStatus());

        product.getVariants().clear();
        product.getAttributes().clear();
        product.getImages().clear();
        productsRepo.saveAndFlush(product);

        if (dto.getVariants() != null && !dto.getVariants().isEmpty()) {
            for (ProductCreateRequestDTO.VariantRequest v : dto.getVariants()) {
                ProductVariants variant = new ProductVariants();
                variant.setProduct(product);
                variant.setSize(v.getSize());
                variant.setColor(v.getColor());
                variant.setPrice(v.getPrice());
                variant.setStockQuantity(v.getStockQuantity());
                variant.setSku(v.getSku());
                variant.setStatus(v.getStatus());
                product.getVariants().add(variant);
            }
        }

        if (dto.getAttributes() != null && !dto.getAttributes().isEmpty()) {
            for (ProductCreateRequestDTO.AttributeRequest a : dto.getAttributes()) {
                ProductAttributes attribute = new ProductAttributes();
                attribute.setProduct(product);
                attribute.setAttributeKey(a.getAttributeKey());
                attribute.setAttributeValue(a.getAttributeValue());
                product.getAttributes().add(attribute);
            }
        }

        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            for (ProductCreateRequestDTO.ImageRequest i : dto.getImages()) {
                ProductImages image = new ProductImages();
                image.setProduct(product);
                image.setImageUrl(i.getImageUrl());
                image.setIsPrimary(i.getIsPrimary());
                image.setDisplayOrder(i.getDisplayOrder());
                product.getImages().add(image);
            }
        }

        Products saved = productsRepo.save(product);

        int variantCount = saved.getVariants().size();
        int totalStock = saved.getVariants().stream()
                .mapToInt(ProductVariants::getStockQuantity).sum();
        String primaryImage = saved.getImages().stream()
                .filter(ProductImages::getIsPrimary)
                .findFirst()
                .map(img -> s3Service.generateViewUrl(img.getImageUrl()))
                .orElse(null);

        String categoryBaseImageUrl = saved.getCategory().getBaseImage() != null
                ? s3Service.generateViewUrl(saved.getCategory().getBaseImage()) : null;
        ProductListResponseDTO.CategorySummary categorySummary = new ProductListResponseDTO.CategorySummary(
                saved.getCategory().getCategoryId(),
                saved.getCategory().getName(),
                categoryBaseImageUrl,
                saved.getCategory().getBaseTitle(),
                saved.getCategory().getBaseShortDescription(),
                saved.getCategory().getBaseDescription()
        );

        return new ProductListResponseDTO.ProductSummary(
                saved.getProductId(),
                saved.getName(),
                saved.getDescription(),
                categorySummary,
                saved.getBasePrice(),
                saved.getStatus(),
                variantCount,
                totalStock,
                primaryImage,
                saved.getCreatedAt(),
                saved.getCategory().getCustomizable(),
                null
        );
    }

    @Transactional
    public void archiveProduct(UUID productId) {
        Products product = productsRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));
        product.setStatus("ARCHIVED");
        productsRepo.save(product);
    }

    @Transactional
    public void unarchiveProduct(UUID productId) {
        Products product = productsRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));
        product.setStatus("ACTIVE");
        productsRepo.save(product);
    }

    public ResponseEntity<?> getSingleProduct(UUID productId) {
        Products product = productsRepo.findById(productId).orElse(null);

        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Product not found"));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("productId", product.getProductId());
        response.put("name", product.getName());
        response.put("description", product.getDescription());
        response.put("basePrice", product.getBasePrice());
        response.put("status", product.getStatus());
        response.put("createdAt", product.getCreatedAt());
        response.put("category", Map.of(
                "categoryId", product.getCategory().getCategoryId(),
                "name", product.getCategory().getName()
        ));
        response.put("variants", product.getVariants().stream().map(v -> Map.of(
                "variantId", v.getVariantId(),
                "size", v.getSize() != null ? v.getSize() : "",
                "color", v.getColor() != null ? v.getColor() : "",
                "price", v.getPrice(),
                "stockQuantity", v.getStockQuantity(),
                "sku", v.getSku() != null ? v.getSku() : "",
                "status", v.getStatus()
        )).toList());
        response.put("attributes", product.getAttributes().stream().map(a -> Map.of(
                "attributeId", a.getAttribute_id(),
                "attributeKey", a.getAttributeKey(),
                "attributeValue", a.getAttributeValue()
        )).toList());
        response.put("images", product.getImages().stream().map(img -> Map.of(
                "imageId", img.getImageId(),
                "imageUrl", s3Service.generateViewUrl(img.getImageUrl()),
                "isPrimary", img.getIsPrimary(),
                "displayOrder", img.getDisplayOrder()
        )).toList());
        response.put("isCustomizable", Boolean.TRUE.equals(product.getCategory().getCustomizable()));
        response.put("defaultPadarId", product.getDefaultPadarId());
        response.put("defaultBorderId", product.getDefaultBorderId());
        response.put("defaultButtiId", product.getDefaultButtiId());
        response.put("defaultBodyColorId", product.getDefaultBodyColorId());
        response.put("defaultBorderColorId", product.getDefaultBorderColorId());
        response.put("defaultZari", product.getDefaultZari());

        return ResponseEntity.ok(response);
    }

    @Transactional(readOnly = true)
    public ProductDetailDTO getProductDetail(UUID productId) {
        Products product = productsRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));

        ProductDetailDTO.CategoryInfo categoryInfo = new ProductDetailDTO.CategoryInfo(
                product.getCategory().getCategoryId(),
                product.getCategory().getName(),
                product.getCategory().getDescription()
        );

        List<ProductDetailDTO.ImageInfo> images = product.getImages().stream()
                .sorted(Comparator.comparingInt(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 0))
                .map(img -> new ProductDetailDTO.ImageInfo(
                        img.getImageId(),
                        s3Service.generateViewUrl(img.getImageUrl()),
                        img.getImageUrl(),
                        Boolean.TRUE.equals(img.getIsPrimary()),
                        img.getDisplayOrder() != null ? img.getDisplayOrder() : 0
                ))
                .toList();

        List<ProductDetailDTO.VariantInfo> variants = product.getVariants().stream()
                .sorted(Comparator.comparing(ProductVariants::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(v -> {
                    String stockLevel;
                    if (v.getStockQuantity() == 0) stockLevel = "OUT_OF_STOCK";
                    else if (v.getStockQuantity() < 5) stockLevel = "LOW";
                    else stockLevel = "GOOD";
                    return new ProductDetailDTO.VariantInfo(
                            v.getVariantId(),
                            v.getSize(),
                            v.getColor(),
                            v.getPrice(),
                            v.getStockQuantity(),
                            v.getSku(),
                            v.getStatus(),
                            stockLevel,
                            v.getCreatedAt()
                    );
                })
                .toList();

        List<ProductDetailDTO.AttributeInfo> attributes = product.getAttributes().stream()
                .map(a -> new ProductDetailDTO.AttributeInfo(
                        a.getAttribute_id(),
                        a.getAttributeKey(),
                        a.getAttributeValue()
                ))
                .toList();

        int totalStock = variants.stream().mapToInt(ProductDetailDTO.VariantInfo::getStockQuantity).sum();
        BigDecimal lowestPrice = variants.stream()
                .map(ProductDetailDTO.VariantInfo::getPrice)
                .filter(Objects::nonNull)
                .min(Comparator.naturalOrder())
                .orElse(product.getBasePrice());
        BigDecimal highestPrice = variants.stream()
                .map(ProductDetailDTO.VariantInfo::getPrice)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(product.getBasePrice());

        return new ProductDetailDTO(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getBasePrice(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt(),
                categoryInfo,
                images,
                variants,
                attributes,
                Boolean.TRUE.equals(product.getCategory().getCustomizable()),
                product.getDefaultPadarId(),
                product.getDefaultBorderId(),
                product.getDefaultButtiId(),
                product.getDefaultBodyColorId(),
                product.getDefaultBorderColorId(),
                product.getDefaultZari(),
                variants.size(),
                totalStock,
                images.size(),
                attributes.size(),
                lowestPrice,
                highestPrice
        );
    }
}
