package com.gajraj.worker.model;


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
@ToString
@Table(name = "materials")
public class Materials {
    @Id
    @GeneratedValue()
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;


    @Column(name = "zari")
    private int zari;

    @Column(name = "silk")
    private int silk;

    @Column(name = "zari_type")
    private ZariType zaritype;

    private enum ZariType {
        GOLDEN, SILVER
    }
}
