package pe.redvecinal.moderacion;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DenunciaRepository extends JpaRepository<Denuncia, UUID> {

    Page<Denuncia> findByEstadoOrderByCreatedAtAsc(EstadoDenuncia estado, Pageable pageable);
}
