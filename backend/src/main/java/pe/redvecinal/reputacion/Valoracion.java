package pe.redvecinal.reputacion;

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

/** Valoración + reseña (det_valoracion). RF41, RF42. RF43/RF44 se garantizan además por trigger. */
@Entity
@Table(name = "det_valoracion")
@Getter
@Setter
@NoArgsConstructor
public class Valoracion {

    @Id
    private UUID id;

    @Column(name = "servicio_id", nullable = false, updatable = false)
    private UUID servicioId;

    @Column(name = "autor_id", nullable = false, updatable = false)
    private UUID autorId;

    @Column(nullable = false)
    private short puntuacion;

    @Column(length = 1000)
    private String comentario;

    @Column(nullable = false)
    private boolean oculta;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
