package pe.redvecinal.shared.historial;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Long> {

    List<HistorialEstado> findByEntidadTipoAndEntidadIdOrderByCreatedAtAsc(EntidadHistorial tipo, UUID entidadId);
}
