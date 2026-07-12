package com.gajraj.product.controller;

import com.gajraj.product.dto.CategoryRequestDTO;
import com.gajraj.product.dto.ProductCreateRequestDTO;
import com.gajraj.product.dto.ProductUpdateRequestDTO;
import com.gajraj.product.dto.VariantUpdateDTO;
import com.gajraj.product.model.Products;
import com.gajraj.product.service.ProductCategoriesService;
import com.gajraj.product.service.ProductImagesService;
import com.gajraj.product.service.ProductVariantsService;
import com.gajraj.product.service.ProductsService;
import com.gajraj.product.service.S3Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/product")
public class ProductsController {

    @Autowired
    private S3Service s3Service;

    @Autowired
    private ProductCategoriesService productCategoriesService;

    @Autowired
    private ProductsService productsService;

    @Autowired
    private ProductVariantsService productVariantsService;

    @Autowired
    private ProductImagesService productImagesService;

    @GetMapping("/upload-url")
    public ResponseEntity<?> getUploadUrl(@RequestParam String category, @RequestParam String filename) {
        return ResponseEntity.ok(s3Service.generateUploadUrl(category, filename));
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            return ResponseEntity.ok(productCategoriesService.getAllCategories());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/categories/create")
    public ResponseEntity<?> createCategory(@RequestBody CategoryRequestDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(productCategoriesService.createCategory(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/categories/update/{categoryId}")
    public ResponseEntity<?> updateCategory(@PathVariable UUID categoryId, @RequestBody CategoryRequestDTO dto) {
        try {
            return ResponseEntity.ok(productCategoriesService.updateCategory(categoryId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/categories/{categoryId}/base-image/upload-url")
    public ResponseEntity<?> getCategoryBaseImageUploadUrl(@PathVariable UUID categoryId,
                                                            @RequestParam String fileName) {
        try {
            return ResponseEntity.ok(productCategoriesService.getCategoryBaseImageUploadUrl(categoryId, fileName));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/categories/{categoryId}/base-image")
    public ResponseEntity<?> setCategoryBaseImage(@PathVariable UUID categoryId,
                                                   @RequestBody Map<String, String> body) {
        try {
            String s3Key = body.get("s3Key");
            if (s3Key == null || s3Key.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "s3Key is required"));
            }
            return ResponseEntity.ok(productCategoriesService.setBaseImage(categoryId, s3Key));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{categoryId}/base-image")
    public ResponseEntity<?> deleteCategoryBaseImage(@PathVariable UUID categoryId) {
        try {
            return ResponseEntity.ok(productCategoriesService.deleteBaseImage(categoryId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/categories/{categoryId}/base-content")
    public ResponseEntity<?> setCategoryBaseContent(@PathVariable UUID categoryId,
                                                     @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(productCategoriesService.setBaseContent(
                    categoryId,
                    body.get("baseTitle"),
                    body.get("baseDescription"),
                    body.get("baseShortDescription")
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/categories/{categoryId}/base-model-url")
    public ResponseEntity<?> setCategoryBaseModelUrl(@PathVariable UUID categoryId,
                                                      @RequestBody Map<String, String> body) {
        try {
            String baseModelUrl = body.get("baseModelUrl");
            return ResponseEntity.ok(productCategoriesService.setBaseModelUrl(categoryId, baseModelUrl));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/categories/{categoryId}/customizable")
    public ResponseEntity<?> setCategoryCustomizable(@PathVariable UUID categoryId,
                                                      @RequestParam boolean value) {
        try {
            return ResponseEntity.ok(productCategoriesService.setCustomizable(categoryId, value));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/categories/delete/{categoryId}")
    public ResponseEntity<?> deleteCategory(@PathVariable UUID categoryId) {
        try {
            productCategoriesService.deleteCategory(categoryId);
            return ResponseEntity.ok(Map.of("message", "Category Deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/upload-urls")
    public ResponseEntity<?> getMultipleUploadUrls(@RequestParam String category,
                                                    @RequestParam List<String> fileNames) {
        return ResponseEntity.ok(s3Service.generateMultipleUploadUrls(category, fileNames));
    }

    @PostMapping("/create")
    public ResponseEntity<?> createProduct(@RequestBody ProductCreateRequestDTO dto) {
        try {
            Products created = productsService.createProduct(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


    @GetMapping("/all")
    public ResponseEntity<?> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        try {
            return ResponseEntity.ok(productsService.getAllProducts(page, size, status, search, categoryId, includeArchived));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/archive/{productId}")
    public ResponseEntity<?> archiveProduct(@PathVariable UUID productId) {
        try {
            productsService.archiveProduct(productId);
            return ResponseEntity.ok(Map.of("message", "Product archived", "productId", productId.toString()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/unarchive/{productId}")
    public ResponseEntity<?> unarchiveProduct(@PathVariable UUID productId) {
        try {
            productsService.unarchiveProduct(productId);
            return ResponseEntity.ok(Map.of("message", "Product restored", "productId", productId.toString()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/update/{productId}")
    public ResponseEntity<?> updateProduct(@PathVariable UUID productId, @RequestBody ProductUpdateRequestDTO dto) {
        try {

            return ResponseEntity.ok(productsService.updateProduct(productId, dto));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


    @GetMapping("/{productId}")
    public ResponseEntity<?> getSingleProduct(@PathVariable UUID productId) {
        try{
            return productsService.getSingleProduct(productId);
        }catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/detail/{productId}")
    public ResponseEntity<?> getProductDetail(@PathVariable UUID productId) {
        try {
            return ResponseEntity.ok(productsService.getProductDetail(productId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/variants/all")
    public ResponseEntity<?> getAllVariants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID productId) {
        try {
            return ResponseEntity.ok(productVariantsService.getAllVariants(page, size, search, status, productId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/variants/update/{variantId}")
    public ResponseEntity<?> updateVariant(@PathVariable UUID variantId, @RequestBody VariantUpdateDTO dto) {
        try {
            return ResponseEntity.ok(productVariantsService.updateVariant(variantId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/variants/delete/{variantId}")
    public ResponseEntity<?> deleteVariant(@PathVariable UUID variantId) {
        try {
            productVariantsService.deleteVariant(variantId);
            return ResponseEntity.ok(Map.of("message", "Variant deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/variants/decrement-stock/{variantId}")
    public ResponseEntity<?> decrementStock(@PathVariable UUID variantId, @RequestParam int quantity) {
        try {
            return ResponseEntity.ok(productVariantsService.decrementStock(variantId, quantity));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/variants/increment-stock/{variantId}")
    public ResponseEntity<?> incrementStock(@PathVariable UUID variantId, @RequestParam int quantity) {
        try {
            return ResponseEntity.ok(productVariantsService.incrementStock(variantId, quantity));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/images/all")
    public ResponseEntity<?> getAllImages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) Boolean primaryOnly) {
        try {
            return ResponseEntity.ok(productImagesService.getAllImages(page, size, productId, primaryOnly));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/images/set-primary/{imageId}")
    public ResponseEntity<?> setPrimaryImage(@PathVariable UUID imageId) {
        try {
            return ResponseEntity.ok(productImagesService.setPrimary(imageId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PutMapping("/images/reorder/{imageId}")
    public ResponseEntity<?> reorderImage(@PathVariable UUID imageId, @RequestParam int newOrder) {
        try {
            return ResponseEntity.ok(productImagesService.reorderImage(imageId, newOrder));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/images/delete/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable UUID imageId) {
        try {
            productImagesService.deleteImage(imageId);
            return ResponseEntity.ok(Map.of("message", "Image deleted"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @PostMapping("/images/add/{productId}")
    public ResponseEntity<?> addImages(
            @PathVariable UUID productId,
            @RequestBody List<ProductCreateRequestDTO.ImageRequest> images) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(productImagesService.addImages(productId, images));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


}
