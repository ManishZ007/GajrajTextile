package com.gajraj.product.service;

import com.gajraj.product.dto.AddToCartRequestDTO;
import com.gajraj.product.dto.CartResponseDTO;
import com.gajraj.product.dto.CartSummaryResponseDTO;
import com.gajraj.product.dto.UpdateCartItemRequestDTO;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class CartService {

    @Autowired private CartRepo cartRepo;
    @Autowired private CartItemRepo cartItemRepo;
    @Autowired private ProductsRepo productsRepo;
    @Autowired private ProductVariantsRepo productVariantsRepo;
    @Autowired private ProductImagesRepo productImagesRepo;
    @Autowired private PadarRepo padarRepo;
    @Autowired private BorderRepo borderRepo;
    @Autowired private ButtiRepo buttiRepo;
    @Autowired private BodyColorRepo bodyColorRepo;
    @Autowired private BorderColorRepo borderColorRepo;
    @Autowired private S3Service s3Service;

    // ─── helpers ────────────────────────────────────────────────────────────

    private Cart getOrCreateCart(UUID customerId) {
        return cartRepo.findByCustomerId(customerId)
                .orElseGet(() -> {
                    Cart c = new Cart();
                    c.setCustomerId(customerId);
                    return cartRepo.save(c);
                });
    }

    private String primaryImageUrl(Products product) {
        return productImagesRepo.findByProductAndIsPrimaryTrue(product)
                .map(img -> s3Service.generateViewUrl(img.getImageUrl()))
                .orElse(null);
    }

    private CartResponseDTO.CustomizationInfo buildCustomizationInfo(CartItem item) {
        if (item.getItemType() != CartItem.ItemType.CUSTOMIZED) return null;

        CartResponseDTO.CustomizationInfo info = new CartResponseDTO.CustomizationInfo();

        if (item.getSelectedPadarId() != null) {
            padarRepo.findById(item.getSelectedPadarId()).ifPresent(p -> {
                info.setPadarId(p.getPadarId());
                info.setPadarName(p.getPadarName());
                info.setPadarModelUrl(p.getModelUrl());
            });
        }
        if (item.getSelectedBorderId() != null) {
            borderRepo.findById(item.getSelectedBorderId()).ifPresent(b -> {
                info.setBorderId(b.getBorderId());
                info.setBorderName(b.getBorderName());
                info.setBorderModelUrl(b.getModelUrl());
            });
        }
        if (item.getSelectedButtiId() != null) {
            buttiRepo.findById(item.getSelectedButtiId()).ifPresent(b -> {
                info.setButtiId(b.getButtiId());
                info.setButtiName(b.getButtiName());
                info.setButtiModelUrl(b.getModelUrl());
            });
        }
        if (item.getSelectedBodyColorId() != null) {
            bodyColorRepo.findById(item.getSelectedBodyColorId()).ifPresent(bc -> {
                info.setBodyColorId(bc.getBodyColorId());
                info.setBodyColorName(bc.getColorName());
                info.setBodyColorHexCode(bc.getHexCode());
            });
        }
        if (item.getSelectedBorderColorId() != null) {
            borderColorRepo.findById(item.getSelectedBorderColorId()).ifPresent(bc -> {
                info.setBorderColorId(bc.getBorderColorId());
                info.setBorderColorName(bc.getColorName());
                info.setBorderColorHexCode(bc.getHexCode());
            });
        }
        info.setZari(item.getSelectedZari());
        return info;
    }

    private CartResponseDTO.CartItemDTO toItemDTO(CartItem item) {
        Products product = item.getProduct();

        CartResponseDTO.ProductInfo productInfo = new CartResponseDTO.ProductInfo(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getBasePrice(),
                product.getStatus(),
                product.getCategory().getCategoryId(),
                product.getCategory().getName()
        );

        CartResponseDTO.VariantInfo variantInfo = null;
        BigDecimal unitPrice;
        boolean inStock;
        Integer availableStock = null;

        if (item.getItemType() == CartItem.ItemType.READY_MADE && item.getVariant() != null) {
            ProductVariants v = item.getVariant();
            variantInfo = new CartResponseDTO.VariantInfo(
                    v.getVariantId(), v.getSize(), v.getColor(),
                    v.getSku(), v.getPrice(), v.getStockQuantity(), v.getStatus()
            );
            unitPrice = v.getPrice();
            availableStock = v.getStockQuantity();
            inStock = v.getStockQuantity() > 0;
        } else {
            unitPrice = product.getBasePrice();
            inStock = true;
        }

        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

        return new CartResponseDTO.CartItemDTO(
                item.getCartItemId(),
                item.getItemType().name(),
                item.getQuantity(),
                unitPrice,
                subtotal,
                productInfo,
                variantInfo,
                buildCustomizationInfo(item),
                primaryImageUrl(product),
                inStock,
                availableStock,
                item.getCreatedAt()
        );
    }

    private CartResponseDTO toCartDTO(Cart cart) {
        List<CartItem> items = cartItemRepo.findByCartOrderByCreatedAtDesc(cart);
        List<CartResponseDTO.CartItemDTO> itemDTOs = items.stream().map(this::toItemDTO).toList();

        BigDecimal subtotal = itemDTOs.stream()
                .map(CartResponseDTO.CartItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponseDTO(
                cart.getCartId(),
                cart.getCustomerId(),
                itemDTOs,
                itemDTOs.size(),
                subtotal,
                subtotal,
                cart.getUpdatedAt()
        );
    }

    private boolean customizationMatches(CartItem existing, AddToCartRequestDTO.CustomizationRequest req) {
        return Objects.equals(existing.getSelectedPadarId(), req.getPadarId())
                && Objects.equals(existing.getSelectedBorderId(), req.getBorderId())
                && Objects.equals(existing.getSelectedButtiId(), req.getButtiId())
                && Objects.equals(existing.getSelectedBodyColorId(), req.getBodyColorId())
                && Objects.equals(existing.getSelectedBorderColorId(), req.getBorderColorId())
                && Objects.equals(existing.getSelectedZari(), req.getZari());
    }

    // ─── public operations ───────────────────────────────────────────────────

    @Transactional
    public CartResponseDTO addToCart(AddToCartRequestDTO dto) {
        if (dto.getCustomerId() == null) throw new IllegalArgumentException("customerId is required");
        if (dto.getProductId() == null) throw new IllegalArgumentException("productId is required");
        if (dto.getItemType() == null) throw new IllegalArgumentException("itemType is required (READY_MADE or CUSTOMIZED)");
        int qty = dto.getQuantity() == null ? 1 : dto.getQuantity();
        if (qty < 1) throw new IllegalArgumentException("Quantity must be at least 1");

        CartItem.ItemType itemType;
        try {
            itemType = CartItem.ItemType.valueOf(dto.getItemType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("itemType must be READY_MADE or CUSTOMIZED");
        }

        Products product = productsRepo.findById(dto.getProductId())
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + dto.getProductId()));

        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new IllegalArgumentException("Product is not available");
        }

        Cart cart = getOrCreateCart(dto.getCustomerId());

        if (itemType == CartItem.ItemType.READY_MADE) {
            if (dto.getVariantId() == null) throw new IllegalArgumentException("variantId is required for READY_MADE items");

            ProductVariants variant = productVariantsRepo.findById(dto.getVariantId())
                    .orElseThrow(() -> new NoSuchElementException("Variant not found: " + dto.getVariantId()));

            if (!variant.getProduct().getProductId().equals(product.getProductId())) {
                throw new IllegalArgumentException("Variant does not belong to this product");
            }
            if (variant.getStockQuantity() < qty) {
                throw new IllegalArgumentException("Insufficient stock. Available: " + variant.getStockQuantity());
            }

            Optional<CartItem> existing = cartItemRepo.findByCartAndProductAndVariant(cart, product, variant);
            if (existing.isPresent()) {
                CartItem item = existing.get();
                int newQty = item.getQuantity() + qty;
                if (variant.getStockQuantity() < newQty) {
                    throw new IllegalArgumentException("Insufficient stock. Available: " + variant.getStockQuantity());
                }
                item.setQuantity(newQty);
                cartItemRepo.save(item);
            } else {
                CartItem item = new CartItem();
                item.setCart(cart);
                item.setProduct(product);
                item.setVariant(variant);
                item.setQuantity(qty);
                item.setItemType(CartItem.ItemType.READY_MADE);
                cartItemRepo.save(item);
            }

        } else {
            if (!Boolean.TRUE.equals(product.getCategory().getCustomizable())) {
                throw new IllegalArgumentException("This product's category does not support customization");
            }

            AddToCartRequestDTO.CustomizationRequest customization =
                    dto.getCustomization() != null ? dto.getCustomization() : new AddToCartRequestDTO.CustomizationRequest();

            List<CartItem> existingCustomized = cartItemRepo
                    .findByCartAndProductAndItemType(cart, product, CartItem.ItemType.CUSTOMIZED);

            Optional<CartItem> matchingItem = existingCustomized.stream()
                    .filter(i -> customizationMatches(i, customization))
                    .findFirst();

            if (matchingItem.isPresent()) {
                CartItem item = matchingItem.get();
                item.setQuantity(item.getQuantity() + qty);
                cartItemRepo.save(item);
            } else {
                CartItem item = new CartItem();
                item.setCart(cart);
                item.setProduct(product);
                item.setVariant(null);
                item.setQuantity(qty);
                item.setItemType(CartItem.ItemType.CUSTOMIZED);
                item.setSelectedPadarId(customization.getPadarId());
                item.setSelectedBorderId(customization.getBorderId());
                item.setSelectedButtiId(customization.getButtiId());
                item.setSelectedBodyColorId(customization.getBodyColorId());
                item.setSelectedBorderColorId(customization.getBorderColorId());
                item.setSelectedZari(customization.getZari());
                cartItemRepo.save(item);
            }
        }

        cart = cartRepo.findByCustomerId(dto.getCustomerId()).orElseThrow();
        return toCartDTO(cart);
    }

    @Transactional(readOnly = true)
    public CartResponseDTO getCart(UUID customerId) {
        Cart cart = cartRepo.findByCustomerId(customerId).orElse(null);
        if (cart == null) {
            return new CartResponseDTO(null, customerId, List.of(), 0, BigDecimal.ZERO, BigDecimal.ZERO, null);
        }
        return toCartDTO(cart);
    }

    @Transactional
    public CartResponseDTO updateQuantity(UUID cartItemId, UpdateCartItemRequestDTO dto) {
        if (dto.getAction() == null) throw new IllegalArgumentException("action is required (SET, INCREASE, DECREASE)");
        if (dto.getQuantity() == null || dto.getQuantity() < 1) throw new IllegalArgumentException("quantity must be at least 1");

        CartItem item = cartItemRepo.findById(cartItemId)
                .orElseThrow(() -> new NoSuchElementException("Cart item not found: " + cartItemId));

        int newQty;
        switch (dto.getAction().toUpperCase()) {
            case "SET" -> newQty = dto.getQuantity();
            case "INCREASE" -> newQty = item.getQuantity() + dto.getQuantity();
            case "DECREASE" -> newQty = item.getQuantity() - dto.getQuantity();
            default -> throw new IllegalArgumentException("action must be SET, INCREASE, or DECREASE");
        }

        if (newQty <= 0) {
            Cart cart = item.getCart();
            cartItemRepo.delete(item);
            return toCartDTO(cart);
        }

        if (item.getItemType() == CartItem.ItemType.READY_MADE && item.getVariant() != null) {
            if (item.getVariant().getStockQuantity() < newQty) {
                throw new IllegalArgumentException("Insufficient stock. Available: " + item.getVariant().getStockQuantity());
            }
        }

        item.setQuantity(newQty);
        cartItemRepo.save(item);
        return toCartDTO(item.getCart());
    }

    @Transactional
    public void removeItem(UUID cartItemId) {
        CartItem item = cartItemRepo.findById(cartItemId)
                .orElseThrow(() -> new NoSuchElementException("Cart item not found: " + cartItemId));
        cartItemRepo.delete(item);
    }

    @Transactional
    public void clearCart(UUID customerId) {
        cartRepo.findByCustomerId(customerId).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepo.save(cart);
        });
    }

    @Transactional(readOnly = true)
    public CartSummaryResponseDTO getCartSummary(UUID customerId) {
        Cart cart = cartRepo.findByCustomerId(customerId).orElse(null);
        if (cart == null) {
            return new CartSummaryResponseDTO(null, customerId, 0, 0, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        List<CartItem> items = cartItemRepo.findByCartOrderByCreatedAtDesc(cart);

        BigDecimal subtotal = items.stream().map(item -> {
            BigDecimal unitPrice = (item.getItemType() == CartItem.ItemType.READY_MADE && item.getVariant() != null)
                    ? item.getVariant().getPrice()
                    : item.getProduct().getBasePrice();
            return unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
        }).reduce(BigDecimal.ZERO, BigDecimal::add);

        long uniqueProducts = items.stream()
                .map(i -> i.getProduct().getProductId())
                .distinct().count();

        return new CartSummaryResponseDTO(
                cart.getCartId(),
                customerId,
                items.size(),
                (int) uniqueProducts,
                subtotal,
                subtotal
        );
    }
}
