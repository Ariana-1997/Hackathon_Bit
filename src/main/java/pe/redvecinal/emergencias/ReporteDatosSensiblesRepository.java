package pe.redvecinal.emergencias;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReporteDatosSensiblesRepository extends JpaRepository<ReporteDatosSensibles, UUID> {
}
