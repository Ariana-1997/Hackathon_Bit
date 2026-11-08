package pe.redvecinal.publicaciones;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;

/** Operaciones comunes a Servicios y Solidaridad: carga, cambio de estado con bitácora y baja lógica. */
@Service
@RequiredArgsConstructor
public class PublicacionService {

    private final PublicacionRepository repository;
    private final HistorialService historial;

    @Transactional(propagation = Propagation.MANDATORY)
    public Publicacion cargar(UUID id, ModuloPublicacion modulo) {
        Publicacion p = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> ApiException.noEncontrado("La publicación"));
        if (p.getModulo() != modulo) {
            throw ApiException.noEncontrado("La publicación");
        }
        return p;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void cambiarEstado(Publicacion p, EstadoPublicacion nuevo, UUID actorId, String motivo) {
        if (p.getEstado() == nuevo) {
            return;
        }
        if (p.getEstado() == EstadoPublicacion.MODERADA) {
            throw ApiException.prohibido("Esta publicación fue ocultada por denuncias de la comunidad y no puede cambiar de estado.");
        }
        EstadoPublicacion anterior = p.cambiarEstado(nuevo);
        historial.registrar(EntidadHistorial.PUBLICACION, p.getId(), anterior, nuevo, actorId, motivo);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void darDeBaja(Publicacion p, UUID actorId, String motivo) {
        EstadoPublicacion anterior = p.darDeBaja();
        historial.registrar(EntidadHistorial.PUBLICACION, p.getId(), anterior, EstadoPublicacion.INACTIVA, actorId,
                motivo != null ? motivo : "Baja lógica");
    }

    /** Lectura de detalle: lo ocultado por moderación responde 404 a todos menos al autor. */
    public void exigirVisible(Publicacion p, UUID lectorId) {
        if (!p.visiblePara(lectorId)) {
            throw ApiException.noEncontrado("La publicación");
        }
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarCreacion(Publicacion p) {
        historial.registrar(EntidadHistorial.PUBLICACION, p.getId(), null, p.getEstado(), p.getAutorId(), "Creación");
    }
}
