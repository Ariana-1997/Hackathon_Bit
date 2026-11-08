package pe.redvecinal.catalogo;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactoSoporteRepository extends JpaRepository<ContactoSoporte, UUID> {

    @Query("""
           select c from ContactoSoporte c
           where c.activo = true and (c.zonaId is null or c.zonaId = :zonaId)
           order by c.orden, c.nombre
           """)
    List<ContactoSoporte> visiblesPara(@Param("zonaId") UUID zonaId);
}
