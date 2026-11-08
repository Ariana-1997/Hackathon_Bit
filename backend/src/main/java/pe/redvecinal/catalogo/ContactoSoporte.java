package pe.redvecinal.catalogo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/** Directorio de soporte (def_contacto_soporte, RF50). zona_id nulo = visible en todas las zonas. */
@Entity
@Table(name = "def_contacto_soporte")
@Getter
@Setter
@NoArgsConstructor
public class ContactoSoporte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "zona_id")
    private UUID zonaId;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 20)
    private String telefono;

    @Column(length = 255)
    private String enlace;

    @Column(nullable = false)
    private short orden;

    @Column(nullable = false)
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
