package pe.redvecinal.moderacion;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaRequest;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaResponse;
import pe.redvecinal.moderacion.ModeracionDtos.ResolverRequest;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionRepository;
import pe.redvecinal.publicaciones.PublicacionService;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;
import pe.redvecinal.shared.security.PerfilSeguridadService;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;
import pe.redvecinal.usuarios.domain.EstadoUsuario;
import pe.redvecinal.usuarios.domain.Usuario;
import pe.redvecinal.usuarios.repository.UsuarioRepository;

/** Módulo 5 - Denuncias (RF46) y moderación con justificación obligatoria (RF47). */
@Service
@RequiredArgsConstructor
public class ModeracionService {

    private final DenunciaRepository denuncias;
    private final PublicacionRepository publicaciones;
    private final PublicacionService publicacionService;
    private final UsuarioRepository usuarios;
    private final PerfilSeguridadService perfilSeguridad;
    private final HistorialService historial;
    private final NotificacionService notificaciones;

    @Transactional
    public DenunciaResponse denunciar(UsuarioAutenticado yo, DenunciaRequest req) {
        if (req.publicacionId() != null) {
            Publicacion p = publicaciones.findByIdAndDeletedAtIsNull(req.publicacionId())
                    .orElseThrow(() -> ApiException.noEncontrado("La publicación"));
            if (p.getAutorId().equals(yo.id())) {
                throw ApiException.reglaNegocio("AUTODENUNCIA", "No puedes denunciar tu propia publicación.");
            }
        } else if (req.usuarioDenunciadoId().equals(yo.id())) {
            throw ApiException.reglaNegocio("AUTODENUNCIA", "No puedes denunciarte a ti mismo.");
        }
        Denuncia d = new Denuncia();
        d.setDenuncianteId(yo.id());
        d.setPublicacionId(req.publicacionId());
        d.setUsuarioDenunciadoId(req.usuarioDenunciadoId());
        d.setMotivo(req.motivo().trim());
        denuncias.saveAndFlush(d);   // uq_denuncia_pendiente -> 409 si ya la denunció
        historial.registrar(EntidadHistorial.DENUNCIA, d.getId(), null, d.getEstado(), yo.id(), null);
        return aResponse(d);
    }

    @Transactional(readOnly = true)
    public PageResponse<DenunciaResponse> listar(EstadoDenuncia estado, Pageable pageable) {
        return PageResponse.de(denuncias.findByEstadoOrderByCreatedAtAsc(estado, pageable), this::aResponse);
    }

    @Transactional
    public DenunciaResponse resolver(UsuarioAutenticado admin, UUID id, ResolverRequest req) {
        Denuncia d = denuncias.findById(id).orElseThrow(() -> ApiException.noEncontrado("La denuncia"));
        if (d.getEstado() != EstadoDenuncia.PENDIENTE) {
            throw ApiException.reglaNegocio("YA_RESUELTA", "La denuncia ya fue atendida.");
        }
        if (req.estado() == EstadoDenuncia.PENDIENTE) {
            throw ApiException.reglaNegocio("ESTADO_INVALIDO", "Elige RESUELTA o RECHAZADA.");
        }
        AccionModeracion accion = req.estado() == EstadoDenuncia.RECHAZADA ? AccionModeracion.NINGUNA : req.accion();
        aplicarAccion(admin, accion, d.getPublicacionId(), d.getUsuarioDenunciadoId(), req.justificacion());

        d.setEstado(req.estado());
        d.setAccion(accion);
        d.setJustificacionAdmin(req.justificacion().trim());
        d.setResueltaPorId(admin.id());
        d.setResueltaEn(OffsetDateTime.now());
        historial.registrar(EntidadHistorial.DENUNCIA, d.getId(), EstadoDenuncia.PENDIENTE, req.estado(), admin.id(),
                req.justificacion());
        return aResponse(d);
    }

    /** RF47: moderación directa de una publicación (sin denuncia previa). */
    @Transactional
    public void moderarPublicacion(UsuarioAutenticado admin, UUID publicacionId, AccionModeracion accion, String justificacion) {
        if (accion != AccionModeracion.OCULTAR && accion != AccionModeracion.ELIMINAR) {
            throw ApiException.reglaNegocio("ACCION_INVALIDA", "Para una publicación usa OCULTAR o ELIMINAR.");
        }
        aplicarAccion(admin, accion, publicacionId, null, justificacion);
    }

    private void aplicarAccion(UsuarioAutenticado admin, AccionModeracion accion, UUID publicacionId,
                               UUID usuarioId, String justificacion) {
        switch (accion) {
            case NINGUNA -> { }
            case OCULTAR, ELIMINAR -> {
                Publicacion p = publicaciones.findByIdAndDeletedAtIsNull(exigir(publicacionId))
                        .orElseThrow(() -> ApiException.noEncontrado("La publicación"));
                if (accion == AccionModeracion.OCULTAR) {
                    publicacionService.cambiarEstado(p, EstadoPublicacion.MODERADA, admin.id(), justificacion);
                } else {
                    publicacionService.darDeBaja(p, admin.id(), justificacion);
                }
                notificaciones.notificar(p.getAutorId(), TipoNotificacion.MODERACION, "Tu publicación fue moderada",
                        justificacion, "PUBLICACION", p.getId());
            }
            case SUSPENDER_USUARIO -> {
                UUID objetivo = usuarioId != null ? usuarioId
                        : publicaciones.findById(exigir(publicacionId)).map(Publicacion::getAutorId)
                            .orElseThrow(() -> ApiException.noEncontrado("La publicación"));
                Usuario u = usuarios.findById(objetivo).orElseThrow(() -> ApiException.noEncontrado("El usuario"));
                u.setEstado(EstadoUsuario.SUSPENDIDO);
                perfilSeguridad.invalidar(u.getAuthUserId());   // efecto inmediato en la siguiente petición
            }
        }
    }

    private static UUID exigir(UUID publicacionId) {
        if (publicacionId == null) {
            throw ApiException.reglaNegocio("SIN_PUBLICACION", "Esta acción requiere una publicación.");
        }
        return publicacionId;
    }

    private DenunciaResponse aResponse(Denuncia d) {
        return new DenunciaResponse(d.getId(), d.getDenuncianteId(), d.getPublicacionId(), d.getUsuarioDenunciadoId(),
                d.getMotivo(), d.getEstado(), d.getAccion(), d.getJustificacionAdmin(), d.getCreatedAt(), d.getResueltaEn());
    }
}
