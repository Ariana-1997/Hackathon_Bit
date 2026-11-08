package pe.redvecinal.reputacion;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.redvecinal.reputacion.ValoracionDtos.ValoracionResponse;

public interface ValoracionRepository extends JpaRepository<Valoracion, UUID> {

    Optional<Valoracion> findByIdAndDeletedAtIsNull(UUID id);

    /** Reseñas visibles con el nombre del autor en una sola consulta (RNF-09). */
    @Query(value = """
           select new pe.redvecinal.reputacion.ValoracionDtos$ValoracionResponse(
                  v.id, v.puntuacion, v.comentario, u.nombre, v.createdAt)
           from Valoracion v join Usuario u on u.id = v.autorId
           where v.servicioId = :servicioId and v.deletedAt is null and v.oculta = false
           order by v.createdAt desc
           """,
           countQuery = """
           select count(v) from Valoracion v
           where v.servicioId = :servicioId and v.deletedAt is null and v.oculta = false
           """)
    Page<ValoracionResponse> listarVisibles(@Param("servicioId") UUID servicioId, Pageable pageable);
}
