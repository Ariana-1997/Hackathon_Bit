package pe.redvecinal.solidaridad;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DetSolidaridadRepository extends JpaRepository<DetSolidaridad, UUID> {

    @Query("select d from DetSolidaridad d join fetch d.publicacion p where p.id = :id and p.deletedAt is null")
    Optional<DetSolidaridad> buscarDetalle(@Param("id") UUID id);

    /** Solo gana la primera aceptación: 0 filas = ya había otra (protección ante doble clic o concurrencia). */
    @Modifying(flushAutomatically = true)
    @Query(value = """
           update det_solidaridad set interaccion_aceptada_id = :interaccionId
           where publicacion_id = :publicacionId and interaccion_aceptada_id is null
           """, nativeQuery = true)
    int asignarGanadora(@Param("publicacionId") UUID publicacionId, @Param("interaccionId") UUID interaccionId);
}
