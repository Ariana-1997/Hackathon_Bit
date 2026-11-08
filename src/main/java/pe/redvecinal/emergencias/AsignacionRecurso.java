package pe.redvecinal.emergencias;

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

/** Asignación de recursos a una emergencia (det_asignacion_recurso, RF37). */
@Entity
@Table(name = "det_asignacion_recurso")
@Getter
@Setter
@NoArgsConstructor
public class AsignacionRecurso {

    @Id
    private UUID id;

    @Column(name = "reporte_id", nullable = false, updatable = false)
    private UUID reporteId;

    @Column(name = "recurso_id", nullable = false, updatable = false)
    private UUID recursoId;

    @Column(nullable = false)
    private int cantidad;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "estado_asignacion")
    private EstadoAsignacion estado = EstadoAsignacion.RESERVADA;

    @Column(name = "asignado_por", nullable = false, updatable = false)
    private UUID asignadoPor;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
