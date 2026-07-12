package com.gajraj.product.service;

import com.gajraj.product.dto.ModelUrlEntityRequestDTO;
import com.gajraj.product.dto.PadarResponseDTO;
import com.gajraj.product.model.Padar;
import com.gajraj.product.model.ProductCategories;
import com.gajraj.product.repo.PadarRepo;
import com.gajraj.product.repo.ProductCategoriesRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class PadarService {

    @Autowired
    private PadarRepo padarRepo;

    @Autowired
    private ProductCategoriesRepo productCategoriesRepo;

    @Transactional
    public PadarResponseDTO create(ModelUrlEntityRequestDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank())
            throw new IllegalArgumentException("name is required");
        if (dto.getModelUrl() == null || dto.getModelUrl().isBlank())
            throw new IllegalArgumentException("modelUrl is required");

        ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));

        Padar padar = new Padar();
        padar.setPadarName(dto.getName());
        padar.setModelUrl(dto.getModelUrl());
        padar.setCategory(category);
        return toDTO(padarRepo.save(padar));
    }

    @Transactional(readOnly = true)
    public List<PadarResponseDTO> getAll() {
        return padarRepo.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public PadarResponseDTO getById(UUID id) {
        return toDTO(padarRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Padar not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<PadarResponseDTO> getByCategoryId(UUID categoryId) {
        return padarRepo.findByCategoryCategoryId(categoryId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public PadarResponseDTO update(UUID id, ModelUrlEntityRequestDTO dto) {
        Padar padar = padarRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Padar not found: " + id));

        if (dto.getName() != null && !dto.getName().isBlank())
            padar.setPadarName(dto.getName());
        if (dto.getModelUrl() != null && !dto.getModelUrl().isBlank())
            padar.setModelUrl(dto.getModelUrl());
        if (dto.getCategoryId() != null) {
            ProductCategories category = productCategoriesRepo.findById(dto.getCategoryId())
                    .orElseThrow(() -> new NoSuchElementException("Category not found: " + dto.getCategoryId()));
            padar.setCategory(category);
        }
        return toDTO(padarRepo.save(padar));
    }

    @Transactional
    public void delete(UUID id) {
        if (!padarRepo.existsById(id))
            throw new NoSuchElementException("Padar not found: " + id);
        padarRepo.deleteById(id);
    }

    private PadarResponseDTO toDTO(Padar p) {
        return new PadarResponseDTO(
                p.getPadarId(),
                p.getPadarName(),
                p.getModelUrl(),
                p.getCategory().getCategoryId(),
                p.getCategory().getName(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
