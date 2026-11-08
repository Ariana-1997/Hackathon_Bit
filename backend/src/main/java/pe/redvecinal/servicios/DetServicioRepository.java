package pe.redvecinal.servicios;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DetServicioRepository extends JpaRepository<DetServicio, UUID> {

    /** Detalle con su publicación en UNA consulta (RNF-09). */
    @Query("select d from DetServicio d join fetch d.publicacion p where p.id = :id and p.deletedAt is null")
    Optional<DetServicio> buscarDetalle(@Param("id") UUID id);
}
