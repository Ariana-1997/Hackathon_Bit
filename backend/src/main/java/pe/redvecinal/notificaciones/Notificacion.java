package pe.redvecinal.notificaciones;

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

/** Bandeja de notificaciones (det_notificacion). El texto NUNCA lleva datos sensibles (RNF-20). */
@Entity
@Table(name = "det_notificacion")
@Getter
@Setter
@NoArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false, updatable = false)
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "tipo_notificacion")
    private TipoNotificacion tipo;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(length = 300)
    private String cuerpo;

    @Column(name = "entidad_tipo", length = 30)
    private String entidadTipo;

    @Column(name = "entidad_id")
    private UUID entidadId;

    @Column(name = "leida_en")
    private OffsetDateTime leidaEn;

    @Column(name = "push_enviada_en")
    private OffsetDateTime pushEnviadaEn;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
