package pe.redvecinal.usuarios.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.MultiPolygon;
import org.locationtech.jts.geom.Point;

/** Zona/comunidad (mae_zona). Se define por polígono o por centro + radio (RF10). */
@Entity
@Table(name = "mae_zona")
@Getter
@NoArgsConstructor
public class Zona {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, columnDefinition = "geography(Point,4326)")
    private Point centro;

    @Column(name = "radio_m")
    private Integer radioM;

    @Column(columnDefinition = "geography(MultiPolygon,4326)")
    private MultiPolygon limite;

    @Column(nullable = false)
    private boolean activa;
}
