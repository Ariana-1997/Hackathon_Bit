package pe.redvecinal.usuarios.domain;

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

/**
 * Perfil del vecino (mae_usuario). Correo y contraseña viven en Supabase Auth (auth.users).
 * Las relaciones se guardan como IDs simples: las lecturas que necesitan joins usan consultas
 * específicas (proyecciones), lo que evita cargas perezosas y N+1 (RNF-09).
 */
@Entity
@Table(name = "mae_usuario")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    private UUID id;

    @Column(name = "auth_user_id", nullable = false, unique = true, updatable = false)
    private UUID authUserId;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 9)
    private String telefono;

    @Column(name = "zona_id")
    private UUID zonaId;

    /** Ubicación APROXIMADA del vecino (RF09). */
    @Column(columnDefinition = "geography(Point,4326)")
    private Point ubicacion;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "estado_usuario")
    private EstadoUsuario estado = EstadoUsuario.ACTIVO;

    @Column(name = "intentos_fallidos", nullable = false)
    private short intentosFallidos;

    @Column(name = "bloqueado_hasta")
    private OffsetDateTime bloqueadoHasta;

    @Column(name = "tutorial_completado", nullable = false)
    private boolean tutorialCompletado;

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

    public static Usuario nuevo(UUID authUserId, String nombre, String telefono) {
        Usuario u = new Usuario();
        u.id = UUID.randomUUID();
        u.authUserId = authUserId;
        u.nombre = nombre;
        u.telefono = telefono;
        return u;
    }

    public boolean estaBloqueado(OffsetDateTime ahora) {
        return bloqueadoHasta != null && bloqueadoHasta.isAfter(ahora);
    }
}
