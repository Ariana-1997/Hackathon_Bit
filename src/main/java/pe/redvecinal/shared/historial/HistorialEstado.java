package pe.redvecinal.shared.historial;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Immutable;

/** Bitácora inalterable de cambios de estado (RF40, RNF-27). La BD bloquea UPDATE/DELETE por trigger. */
@Entity
@Immutable
@Table(name = "det_historial_estado")
@Getter
@NoArgsConstructor
public class HistorialEstado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entidad_tipo", nullable = false, length = 30)
    private EntidadHistorial entidadTipo;

    @Column(name = "entidad_id", nullable = false)
    private UUID entidadId;

    @Column(name = "estado_anterior", length = 30)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", nullable = false, length = 30)
    private String estadoNuevo;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(length = 500)
    private String motivo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public HistorialEstado(EntidadHistorial tipo, UUID entidadId, String anterior, String nuevo, UUID actorId, String motivo) {
        this.entidadTipo = tipo;
        this.entidadId = entidadId;
        this.estadoAnterior = anterior;
        this.estadoNuevo = nuevo;
        this.actorId = actorId;
        this.motivo = motivo;
    }
}
