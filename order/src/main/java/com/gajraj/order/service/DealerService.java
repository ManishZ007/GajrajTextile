package com.gajraj.order.service;

import com.gajraj.order.dto.dealer.DealerRequestDTO;
import com.gajraj.order.dto.dealer.DealerResponseDTO;
import com.gajraj.order.model.Dealer;
import com.gajraj.order.repo.DealerRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DealerService {

    private final DealerRepo dealerRepo;

    public DealerService(DealerRepo dealerRepo) {
        this.dealerRepo = dealerRepo;
    }

    @Transactional
    public DealerResponseDTO createDealer(DealerRequestDTO dto, String managerId) {
        if (dto.getName() == null || dto.getName().isBlank())
            throw new IllegalArgumentException("Dealer name is required");
        if (dto.getPhone() == null || dto.getPhone().isBlank())
            throw new IllegalArgumentException("Dealer phone is required");

        Dealer dealer = new Dealer();
        mapFields(dealer, dto);
        dealer.setCreatedByManagerId(managerId);
        return toDTO(dealerRepo.save(dealer));
    }

    @Transactional(readOnly = true)
    public List<DealerResponseDTO> getAllDealers(String search) {
        List<Dealer> dealers;
        if (search != null && !search.isBlank()) {
            dealers = dealerRepo.findByNameContainingIgnoreCase(search);
        } else {
            dealers = dealerRepo.findAll();
        }
        return dealers.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DealerResponseDTO> getDealersByManager(String managerId) {
        return dealerRepo.findByCreatedByManagerId(managerId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DealerResponseDTO getDealerById(UUID dealerId) {
        return toDTO(findOrThrow(dealerId));
    }

    @Transactional
    public DealerResponseDTO updateDealer(UUID dealerId, DealerRequestDTO dto) {
        Dealer dealer = findOrThrow(dealerId);
        mapFields(dealer, dto);
        return toDTO(dealerRepo.save(dealer));
    }

    @Transactional
    public void deleteDealer(UUID dealerId) {
        if (!dealerRepo.existsById(dealerId))
            throw new NoSuchElementException("Dealer not found: " + dealerId);
        dealerRepo.deleteById(dealerId);
    }

    private Dealer findOrThrow(UUID id) {
        return dealerRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dealer not found: " + id));
    }

    private void mapFields(Dealer dealer, DealerRequestDTO dto) {
        dealer.setName(dto.getName());
        dealer.setPhone(dto.getPhone());
        dealer.setEmail(dto.getEmail());
        dealer.setAddress(dto.getAddress());
        dealer.setCity(dto.getCity());
        dealer.setState(dto.getState());
        dealer.setGstNumber(dto.getGstNumber());
        dealer.setNotes(dto.getNotes());
        if (dto.getDealerType() != null) {
            try {
                dealer.setDealerType(Dealer.DealerType.valueOf(dto.getDealerType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid dealer type: " + dto.getDealerType());
            }
        }
    }

    public DealerResponseDTO toDTO(Dealer d) {
        DealerResponseDTO dto = new DealerResponseDTO();
        dto.setDealerId(d.getId());
        dto.setName(d.getName());
        dto.setPhone(d.getPhone());
        dto.setEmail(d.getEmail());
        dto.setAddress(d.getAddress());
        dto.setCity(d.getCity());
        dto.setState(d.getState());
        dto.setDealerType(d.getDealerType() != null ? d.getDealerType().name() : null);
        dto.setGstNumber(d.getGstNumber());
        dto.setNotes(d.getNotes());
        dto.setCreatedByManagerId(d.getCreatedByManagerId());
        dto.setCreatedAt(d.getCreatedAt());
        dto.setUpdatedAt(d.getUpdatedAt());
        return dto;
    }
}
