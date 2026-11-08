package pe.redvecinal.publicaciones;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicacionRepository extends JpaRepository<Publicacion, UUID> {

    Optional<Publicacion> findByIdAndDeletedAtIsNull(UUID id);

    Page<Publicacion> findByAutorIdAndModuloAndDeletedAtIsNullOrderByCreatedAtDesc(UUID autorId, ModuloPublicacion modulo,
                                                                                  Pageable pageable);
}
