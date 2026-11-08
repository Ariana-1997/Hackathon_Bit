package pe.redvecinal.solidaridad;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.redvecinal.solidaridad.SolidaridadDtos.InteraccionResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.MiInteraccionResponse;

public interface InteraccionRepository extends JpaRepository<InteraccionPublicacion, UUID> {

    Optional<InteraccionPublicacion> findByIdAndPublicacionId(UUID id, UUID publicacionId);

    List<InteraccionPublicacion> findByPublicacionIdAndEstado(UUID publicacionId, EstadoInteraccion estado);

    @Query("""
           select new pe.redvecinal.solidaridad.SolidaridadDtos$InteraccionResponse(
                  i.id, i.usuarioId, u.nombre, i.estado, i.mensaje, i.createdAt)
           from InteraccionPublicacion i join Usuario u on u.id = i.usuarioId
           where i.publicacionId = :publicacionId
           order by i.createdAt
           """)
    List<InteraccionResponse> listarDePublicacion(@Param("publicacionId") UUID publicacionId);

    /** RF28: historial personal de ayudas ofrecidas. */
    @Query(value = """
           select new pe.redvecinal.solidaridad.SolidaridadDtos$MiInteraccionResponse(
                  i.id, p.id, p.tipo, p.titulo, p.estado, i.estado, i.createdAt)
           from InteraccionPublicacion i join Publicacion p on p.id = i.publicacionId
           where i.usuarioId = :usuarioId
           order by i.createdAt desc
           """,
           countQuery = "select count(i) from InteraccionPublicacion i where i.usuarioId = :usuarioId")
    Page<MiInteraccionResponse> listarMias(@Param("usuarioId") UUID usuarioId, Pageable pageable);
}
