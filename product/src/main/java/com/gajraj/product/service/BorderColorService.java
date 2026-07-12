package com.gajraj.product.service;

import com.gajraj.product.dto.BorderColorResponseDTO;
import com.gajraj.product.dto.ColorEntityRequestDTO;
import com.gajraj.product.model.BorderColor;
import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.repo.BorderColorRepo;
import com.gajraj.product.repo.ProductCategoriesRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class BorderColorService {

    @Autowired
    private BorderColorRepo borderColorRepo;

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Transactional
    public BorderColorResponseDTO create(ColorEntityRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank())
            throw new IllegalArgumentException("name is required");
        if (dto.getHexCode() == null || dto.getHexCode().isBlank())
            throw new IllegalArgumentException("hexCode is required");

        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));

        BorderColor borderColor = new BorderColor();
        borderColor.setColorName(dto.getName());
        borderColor.setHexCode(dto.getHexCode());
        borderColor.setCategory(category);
        return toDTO(borderColorRepo.save(borderColor));
    }

    @Transactional(readOnly = true)
    public List<BorderColorResponseDTO> getAll() {
        return borderColorRepo.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public BorderColorResponseDTO getById(UUID id) {
        return toDTO(borderColorRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("BorderColor not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<BorderColorResponseDTO> getByCategoryId(UUID categoryId) {
        return borderColorRepo.findByCategoryCategoryId(categoryId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public BorderColorResponseDTO update(UUID id, ColorEntityRequestDTO dto) {
        BorderColor borderColor = borderColorRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("BorderColor not found: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            borderColor.setColorName(dto.getName());
        if (dto.getHexCode() != null && !dto.getHexCode().isBlank())
            borderColor.setHexCode(dto.getHexCode());
        if (dto.getCategoryId() != null) {
            ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));
            borderColor.setCategory(category);
        }
        return toDTO(borderColorRepo.save(borderColor));
    }

    @Transactional
    public void delete(UUID id) {
        if (!borderColorRepo.existsById(id))
            throw new NoSuchElementException("BorderColor not found: " + id);
        borderColorRepo.deleteById(id);
    }

    private BorderColorResponseDTO toDTO(BorderColor b) {
        return new BorderColorResponseDTO(
                b.getBorderColorId(),
                b.getColorName(),
                b.getHexCode(),
                b.getCategory().getCategoryId(),
                b.getCategory().getName(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
