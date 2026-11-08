package pe.redvecinal.moderacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaRequest;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaResponse;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionRepository;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;
import pe.redvecinal.shared.security.UsuarioAutenticado;

/**
 * Módulo 5 - Denuncias (RF46) y moderación comunitaria (RF47).
 * Las denuncias a publicaciones pueden ocultarla automáticamente (ver {@link OcultamientoAutomatico});
 * las denuncias a usuarios quedan registradas.
 */
@Service
@RequiredArgsConstructor
public class ModeracionService {

    private final DenunciaRepository denuncias;
    private final PublicacionRepository publicaciones;
    private final HistorialService historial;
    private final OcultamientoAutomatico ocultamiento;

    @Transactional
    public DenunciaResponse denunciar(UsuarioAutenticado yo, DenunciaRequest req) {
        Publicacion p = null;
        if (req.publicacionId() != null) {
            p = publicaciones.findParaActualizar(req.publicacionId())
                    .orElseThrow(() -> ApiException.noEncontrado("La publicación"));
            if (p.getAutorId().equals(yo.id())) {
                throw ApiException.reglaNegocio("AUTODENUNCIA", "No puedes denunciar tu propia publicación.");
            }
            if (p.getEstado() == EstadoPublicacion.MODERADA) {
                throw ApiException.reglaNegocio("YA_MODERADA", "Esta publicación ya fue ocultada.");
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

        if (p != null) {
            ocultamiento.evaluar(p);
        }
        return aResponse(d);
    }

    private DenunciaResponse aResponse(Denuncia d) {
        return new DenunciaResponse(d.getId(), d.getDenuncianteId(), d.getPublicacionId(), d.getUsuarioDenunciadoId(),
                d.getMotivo(), d.getEstado(), d.getAccion(), d.getJustificacion(), d.getCreatedAt(), d.getResueltaEn());
    }
}
