package pe.redvecinal.usuarios.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.usuarios.domain.EstadoUsuario;
import pe.redvecinal.usuarios.domain.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Usuario> findByAuthUserId(UUID authUserId);

    /** Datos mínimos para autorizar cada petición (se cachean). */
    @Query("""
           select new pe.redvecinal.shared.security.UsuarioAutenticado(u.id, u.authUserId, u.zonaId, u.estado)
           from Usuario u where u.authUserId = :authUserId and u.deletedAt is null
           """)
    Optional<UsuarioAutenticado> buscarPerfilSeguridad(@Param("authUserId") UUID authUserId);

    /**
     * El correo vive en auth.users (Supabase). El backend se conecta con el rol dueño (postgres),
     * por lo que puede leer ese esquema para aplicar el bloqueo por intentos (RF06).
     */
    @Query(value = """
           select u.* from mae_usuario u
           join auth.users a on a.id = u.auth_user_id
           where lower(a.email) = lower(:email) and u.deleted_at is null
           """, nativeQuery = true)
    Optional<Usuario> buscarPorEmail(@Param("email") String email);

    /** Incremento atómico; al llegar al máximo bloquea N minutos y reinicia el contador (RF06). */
    @Transactional
    @Modifying
    @Query(value = """
           update mae_usuario set
             bloqueado_hasta   = case when intentos_fallidos + 1 >= :max then now() + make_interval(mins => :minutos)
                                      else bloqueado_hasta end,
             intentos_fallidos = case when intentos_fallidos + 1 >= :max then 0 else intentos_fallidos + 1 end
           where id = :id
           """, nativeQuery = true)
    int registrarIntentoFallido(@Param("id") UUID id, @Param("max") int max, @Param("minutos") int minutos);

    @Transactional
    @Modifying
    @Query(value = "update mae_usuario set intentos_fallidos = 0, bloqueado_hasta = null where id = :id", nativeQuery = true)
    int reiniciarIntentos(@Param("id") UUID id);

    @Query("select u.nombre from Usuario u where u.id = :id")
    Optional<String> buscarNombre(@Param("id") UUID id);

    /** Vecinos activos de la zona, salvo el indicado: destinatarios de alertas de emergencia (RF31, RF48). */
    default List<UUID> buscarVecinosDeZona(UUID zonaId, UUID excluirId) {
        return buscarIdsActivosDeZona(EstadoUsuario.ACTIVO, zonaId, excluirId);
    }

    @Query("""
           select u.id from Usuario u
           where u.estado = :estado and u.deletedAt is null
             and u.zonaId = :zonaId and u.id <> :excluirId
           """)
    List<UUID> buscarIdsActivosDeZona(@Param("estado") EstadoUsuario estado, @Param("zonaId") UUID zonaId,
                                      @Param("excluirId") UUID excluirId);
}
