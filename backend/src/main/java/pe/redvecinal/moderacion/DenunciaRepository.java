package pe.redvecinal.moderacion;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DenunciaRepository extends JpaRepository<Denuncia, UUID> {

    /** uq_denuncia_pendiente garantiza una sola pendiente por denunciante y publicación. */
    List<Denuncia> findByPublicacionIdAndEstado(UUID publicacionId, EstadoDenuncia estado);
}
