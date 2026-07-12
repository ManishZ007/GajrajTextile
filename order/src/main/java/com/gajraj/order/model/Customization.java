package com.gajraj.order.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "customizations")
public class Customization {

    @Id
    @GeneratedValue
    @Column(name="customization_id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "padar")
    private String padar;

    @Column(name = "butti")
    private String butti;

    @Column(name = "kinar")
    private String kinar;

    @Column(name = "zari")
    private String zari;

    @Column(name = "gond")
    private String gond;

    @Column(name = "baseColor")
    private String baseColor;

    @Column(name = "preview_image_url")
    private String previewImageUrl;

    @ToString.Exclude
    @OneToOne
    @JoinColumn(name = "order_id")
    private Orders order;
}
