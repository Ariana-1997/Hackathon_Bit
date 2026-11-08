package pe.redvecinal.usuarios.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.redvecinal.usuarios.domain.Zona;

public interface ZonaRepository extends JpaRepository<Zona, UUID> {

    List<Zona> findByActivaTrueOrderByNombre();

    /**
     * RF10: zona que contiene el punto (por polígono) o, si no hay polígono, cuyo círculo centro+radio lo cubre.
     * Si hay varias, la de centro más cercano. Usa los índices GiST de mae_zona (RNF-05).
     */
    @Query(value = """
           select cast(z.id as text) from mae_zona z
           where z.activa and (
                 (z.limite is not null and ST_Covers(z.limite, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography)))
              or (z.limite is null and ST_DWithin(z.centro, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography), z.radio_m)))
           order by ST_Distance(z.centro, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography))
           limit 1
           """, nativeQuery = true)
    Optional<String> buscarZonaIdPorPunto(@Param("lat") double lat, @Param("lng") double lng);
}
