package pe.redvecinal.emergencias;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/** Inventario de almacenes comunales (mae_recurso, RF36). */
@Entity
@Table(name = "mae_recurso")
@Getter
@Setter
@NoArgsConstructor
public class Recurso {

    @Id
    private UUID id;

    @Column(name = "zona_id", nullable = false)
    private UUID zonaId;

    @Column(name = "categoria_id", nullable = false)
    private Integer categoriaId;

    @Column(nullable = false, length = 300)
    private String descripcion;

    @Column(nullable = false, length = 30)
    private String unidad = "unidad";

    @Column(name = "cantidad_total", nullable = false)
    private int cantidadTotal;

    @Column(name = "cantidad_disponible", nullable = false)
    private int cantidadDisponible;

    @Column(name = "almacen_texto", nullable = false, length = 255)
    private String almacenTexto;

    @Column(nullable = false)
    private boolean activo = true;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
