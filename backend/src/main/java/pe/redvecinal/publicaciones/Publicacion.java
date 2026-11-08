package pe.redvecinal.publicaciones;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

/** Base común de Servicios (ECONOMIA) y Solidaridad (mae_publicacion). */
@Entity
@Table(name = "mae_publicacion")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Publicacion {

    /** Puede venir del cliente (UUID generado offline) para que los reintentos no dupliquen (RNF-29). */
    @Id
    private UUID id;

    @Column(name = "autor_id", nullable = false, updatable = false)
    private UUID autorId;

    @Column(name = "zona_id", nullable = false)
    private UUID zonaId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, updatable = false, columnDefinition = "modulo_publicacion")
    private ModuloPublicacion modulo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, updatable = false, columnDefinition = "tipo_publicacion")
    private TipoPublicacion tipo;

    @Column(name = "categoria_id", nullable = false)
    private Integer categoriaId;

    @Column(nullable = false, length = 160)
    private String titulo;

    @Column(nullable = false, columnDefinition = "text")
    private String descripcion;

    @Column(columnDefinition = "geography(Point,4326)")
    private Point ubicacion;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "estado_publicacion")
    private EstadoPublicacion estado = EstadoPublicacion.ACTIVA;

    @Column(name = "expira_en")
    private OffsetDateTime expiraEn;

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

    public static Publicacion nueva(UUID id, UUID autorId, UUID zonaId, TipoPublicacion tipo, Integer categoriaId,
                                    String titulo, String descripcion, Point ubicacion) {
        Publicacion p = new Publicacion();
        p.id = id != null ? id : UUID.randomUUID();
        p.autorId = autorId;
        p.zonaId = zonaId;
        p.tipo = tipo;
        p.modulo = tipo.modulo();
        p.categoriaId = categoriaId;
        p.titulo = titulo.trim();
        p.descripcion = descripcion;
        p.ubicacion = ubicacion;
        return p;
    }

    /** Cambia el estado y devuelve el anterior (para la bitácora). */
    public EstadoPublicacion cambiarEstado(EstadoPublicacion nuevo) {
        EstadoPublicacion anterior = this.estado;
        this.estado = nuevo;
        return anterior;
    }

    /** Baja lógica (RF14). */
    public EstadoPublicacion darDeBaja() {
        this.deletedAt = OffsetDateTime.now();
        return cambiarEstado(EstadoPublicacion.INACTIVA);
    }

    public boolean eliminada() { return deletedAt != null; }

    /** Una publicación ocultada por la comunidad solo la sigue viendo su autor. */
    public boolean visiblePara(UUID usuarioId) {
        return estado != EstadoPublicacion.MODERADA || autorId.equals(usuarioId);
    }
}
