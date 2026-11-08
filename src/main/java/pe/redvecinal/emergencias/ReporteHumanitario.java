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
import org.locationtech.jts.geom.Point;

/** Alerta de emergencia o necesidad crítica (mae_reporte_humanitario). SIN datos personales. */
@Entity
@Table(name = "mae_reporte_humanitario")
@Getter
@Setter
@NoArgsConstructor
public class ReporteHumanitario {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, updatable = false, columnDefinition = "tipo_reporte")
    private TipoReporte tipo;

    @Column(name = "reportante_id", nullable = false, updatable = false)
    private UUID reportanteId;

    @Column(name = "zona_id", nullable = false)
    private UUID zonaId;

    @Column(name = "categoria_id", nullable = false)
    private Integer categoriaId;

    @Column(name = "descripcion_necesidad", nullable = false, length = 1000)
    private String descripcionNecesidad;

    @Column(name = "numero_personas")
    private Short numeroPersonas;

    /** Lo único visible en el dashboard (RF35, RNF-20). */
    @Column(name = "ubicacion_aprox", nullable = false, columnDefinition = "geography(Point,4326)")
    private Point ubicacionAprox;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "prioridad_emergencia")
    private PrioridadEmergencia prioridad = PrioridadEmergencia.MEDIA;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "estado_reporte")
    private EstadoReporte estado = EstadoReporte.ABIERTA;

    @Column(name = "es_anonimo", nullable = false)
    private boolean esAnonimo;

    @Column(name = "responsable_id")
    private UUID responsableId;

    @Column(name = "motivo_cierre", length = 500)
    private String motivoCierre;

    @Column(name = "cerrado_en")
    private OffsetDateTime cerradoEn;

    @Column(name = "cerrado_por_id")
    private UUID cerradoPorId;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    /** Aplica la transición (respetando ck_reporte_cierre) y devuelve el estado anterior. */
    public EstadoReporte transicionar(EstadoReporte nuevo, UUID actorId, String motivo) {
        EstadoReporte anterior = this.estado;
        if (!anterior.siguientesPermitidos().contains(nuevo)) {
            throw new IllegalStateException("Transición no permitida " + anterior + " -> " + nuevo);
        }
        this.estado = nuevo;
        if (nuevo.esCierre()) {
            this.cerradoEn = OffsetDateTime.now();
            this.cerradoPorId = actorId;
            this.motivoCierre = motivo;
        } else {
            this.cerradoEn = null;
            this.cerradoPorId = null;
        }
        return anterior;
    }
}
