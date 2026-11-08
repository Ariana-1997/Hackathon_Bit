package pe.redvecinal.moderacion;

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
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Denuncias y moderación comunitaria (det_denuncia). RF46, RF47. */
@Entity
@Table(name = "det_denuncia")
@Getter
@Setter
@NoArgsConstructor
public class Denuncia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "denunciante_id", nullable = false, updatable = false)
    private UUID denuncianteId;

    @Column(name = "publicacion_id", updatable = false)
    private UUID publicacionId;

    @Column(name = "usuario_denunciado_id", updatable = false)
    private UUID usuarioDenunciadoId;

    @Column(nullable = false, length = 500)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "estado_denuncia")
    private EstadoDenuncia estado = EstadoDenuncia.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(columnDefinition = "accion_moderacion")
    private AccionModeracion accion;

    @Column(length = 1000)
    private String justificacion;

    /** null = resuelta automáticamente por el sistema. */
    @Column(name = "resuelta_por_id")
    private UUID resueltaPorId;

    @Column(name = "resuelta_en")
    private OffsetDateTime resueltaEn;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    /** Cierre automático (ck_denuncia_resolucion: justificación de al menos 10 caracteres). */
    public void resolverPorSistema(AccionModeracion accion, String justificacion) {
        this.estado = EstadoDenuncia.RESUELTA;
        this.accion = accion;
        this.justificacion = justificacion;
        this.resueltaPorId = null;
        this.resueltaEn = OffsetDateTime.now();
    }
}
