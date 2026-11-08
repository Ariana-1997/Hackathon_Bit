package pe.redvecinal.emergencias;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AsignacionRepository extends JpaRepository<AsignacionRecurso, UUID> {

    List<AsignacionRecurso> findByReporteIdOrderByCreatedAt(UUID reporteId);
}
