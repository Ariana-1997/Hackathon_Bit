package pe.redvecinal.publicaciones;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PublicacionRepository extends JpaRepository<Publicacion, UUID> {

    Optional<Publicacion> findByIdAndDeletedAtIsNull(UUID id);

    /** SELECT ... FOR UPDATE: serializa operaciones que dependen de un conteo (p. ej. denuncias). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Publicacion p where p.id = :id and p.deletedAt is null")
    Optional<Publicacion> findParaActualizar(@Param("id") UUID id);

    Page<Publicacion> findByAutorIdAndModuloAndDeletedAtIsNullOrderByCreatedAtDesc(UUID autorId, ModuloPublicacion modulo,
                                                                                  Pageable pageable);
}
