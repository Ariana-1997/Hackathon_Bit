package pe.redvecinal.solidaridad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

/** Postulación / ofrecimiento / "quiero ayudar" (det_interaccion_publicacion). RF22, RF30. */
@Entity
@Table(name = "det_interaccion_publicacion")
@Getter
@Setter
@NoArgsConstructor
public class InteraccionPublicacion {

    @Id
    private UUID id;

    @Column(name = "publicacion_id", nullable = false, updatable = false)
    private UUID publicacionId;

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "estado_interaccion")
    private EstadoInteraccion estado = EstadoInteraccion.PENDIENTE;

    @Column(length = 1000)
    private String mensaje;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
