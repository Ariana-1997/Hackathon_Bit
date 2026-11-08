package pe.redvecinal.notificaciones;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuscripcionPushRepository extends JpaRepository<SuscripcionPush, UUID> {

    Optional<SuscripcionPush> findByEndpoint(String endpoint);

    List<SuscripcionPush> findByUsuarioIdAndActivaTrue(UUID usuarioId);
}
