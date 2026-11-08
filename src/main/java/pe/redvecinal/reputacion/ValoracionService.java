package pe.redvecinal.reputacion;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.ModuloPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionService;
import pe.redvecinal.reputacion.ValoracionDtos.ValoracionRequest;
import pe.redvecinal.reputacion.ValoracionDtos.ValoracionResponse;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

/**
 * Módulo 5 - Reputación (RF41 a RF45).
 * Las reglas RF43 (misma zona) y RF44 (no autovaloración) se validan aquí para dar un mensaje claro
 * y, como última barrera, en el trigger fn_validar_valoracion de la BD. El promedio (RF45) lo recalcula
 * el trigger trg_valoracion_reputacion dentro de la misma transacción.
 */
@Service
@RequiredArgsConstructor
public class ValoracionService {

    private final ValoracionRepository repository;
    private final PublicacionService publicacionService;
    private final NotificacionService notificaciones;

    @Transactional
    public ValoracionResponse crear(UsuarioAutenticado yo, UUID servicioId, ValoracionRequest req) {
        Publicacion servicio = publicacionService.cargar(servicioId, ModuloPublicacion.ECONOMIA);
        if (servicio.getEstado() != EstadoPublicacion.ACTIVA) {
            throw ApiException.reglaNegocio("SERVICIO_NO_ACTIVO", "Este servicio no está disponible para valoraciones.");
        }
        if (servicio.getAutorId().equals(yo.id())) {
            throw ApiException.reglaNegocio("AUTOVALORACION", "No puedes valorar tu propio servicio.");
        }
        if (!servicio.getZonaId().equals(yo.zonaId())) {
            throw ApiException.reglaNegocio("OTRA_ZONA", "Solo los vecinos de la misma zona pueden valorar este servicio.");
        }
        Valoracion v = new Valoracion();
        v.setId(UUID.randomUUID());
        v.setServicioId(servicioId);
        v.setAutorId(yo.id());
        v.setPuntuacion(req.puntuacion());
        v.setComentario(limpiar(req.comentario()));
        repository.saveAndFlush(v);   // flush: si el trigger o el UNIQUE fallan, el error sale aquí (409/422)

        notificaciones.notificar(servicio.getAutorId(), TipoNotificacion.NUEVA_VALORACION,
                "Recibiste una nueva valoración", v.getPuntuacion() + " estrellas en \"" + servicio.getTitulo() + "\"",
                "PUBLICACION", servicioId);
        return new ValoracionResponse(v.getId(), v.getPuntuacion(), v.getComentario(), null, v.getCreatedAt());
    }

    @Transactional
    public ValoracionResponse actualizar(UsuarioAutenticado yo, UUID valoracionId, ValoracionRequest req) {
        Valoracion v = cargarPropia(yo, valoracionId);
        v.setPuntuacion(req.puntuacion());
        v.setComentario(limpiar(req.comentario()));
        return new ValoracionResponse(v.getId(), v.getPuntuacion(), v.getComentario(), null, v.getCreatedAt());
    }

    @Transactional
    public void eliminar(UsuarioAutenticado yo, UUID valoracionId) {
        cargarPropia(yo, valoracionId).setDeletedAt(OffsetDateTime.now());
    }

    /** Moderación de reseñas (RF47). El trigger excluye las ocultas del promedio. */
    @Transactional
    public void ocultar(UUID valoracionId) {
        repository.findByIdAndDeletedAtIsNull(valoracionId)
                .orElseThrow(() -> ApiException.noEncontrado("La valoración")).setOculta(true);
    }

    @Transactional(readOnly = true)
    public PageResponse<ValoracionResponse> listar(UUID servicioId, Pageable pageable) {
        return PageResponse.de(repository.listarVisibles(servicioId, pageable));
    }

    private Valoracion cargarPropia(UsuarioAutenticado yo, UUID id) {
        Valoracion v = repository.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> ApiException.noEncontrado("La valoración"));
        yo.exigirDuenio(v.getAutorId());
        return v;
    }

    private static String limpiar(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
