package pe.redvecinal.notificaciones;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface NotificacionRepository extends JpaRepository<Notificacion, UUID> {

    Page<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId, Pageable pageable);

    long countByUsuarioIdAndLeidaEnIsNull(UUID usuarioId);

    Optional<Notificacion> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    @Transactional
    @Modifying
    @Query("update Notificacion n set n.leidaEn = current_timestamp where n.usuarioId = :usuarioId and n.leidaEn is null")
    int marcarTodasLeidas(@Param("usuarioId") UUID usuarioId);

    @Transactional
    @Modifying
    @Query("update Notificacion n set n.pushEnviadaEn = current_timestamp where n.id = :id")
    int marcarPushEnviada(@Param("id") UUID id);
}
