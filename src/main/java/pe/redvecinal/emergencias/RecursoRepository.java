package pe.redvecinal.emergencias;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecursoRepository extends JpaRepository<Recurso, UUID> {

    List<Recurso> findByZonaIdAndActivoTrueOrderByDescripcion(UUID zonaId);

    /** Descuento atómico (patrón indicado en bd_v2): 0 filas = sin stock suficiente o recurso inactivo. */
    @Modifying(flushAutomatically = true)
    @Query(value = """
           update mae_recurso set cantidad_disponible = cantidad_disponible - :cantidad, version = version + 1
           where id = :id and activo and cantidad_disponible >= :cantidad
           """, nativeQuery = true)
    int descontar(@Param("id") UUID id, @Param("cantidad") int cantidad);

    @Modifying(flushAutomatically = true)
    @Query(value = """
           update mae_recurso set cantidad_disponible = cantidad_disponible + :cantidad, version = version + 1
           where id = :id
           """, nativeQuery = true)
    int devolver(@Param("id") UUID id, @Param("cantidad") int cantidad);
}
