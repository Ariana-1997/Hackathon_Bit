package pe.redvecinal.moderacion;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionService;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;

/**
 * Moderación comunitaria (RF47 sin administradores): cuando una publicación acumula el umbral de
 * denuncias pendientes (app.moderacion.denuncias-para-ocultar) pasa a MODERADA, las denuncias quedan
 * resueltas por el sistema y se avisa al autor.
 */
@Slf4j
@Component
@RequiredArgsConstructor
class OcultamientoAutomatico {

    private final DenunciaRepository denuncias;
    private final PublicacionService publicacionService;
    private final NotificacionService notificaciones;
    private final HistorialService historial;
    private final AppProperties props;

    /** Requiere la publicación bloqueada (FOR UPDATE) para que dos denuncias simultáneas no se pierdan el umbral. */
    @Transactional(propagation = Propagation.MANDATORY)
    void evaluar(Publicacion p) {
        int umbral = props.moderacion().denunciasParaOcultar();
        List<Denuncia> pendientes = denuncias.findByPublicacionIdAndEstado(p.getId(), EstadoDenuncia.PENDIENTE);
        if (pendientes.size() < umbral || p.getEstado() == EstadoPublicacion.MODERADA) {
            return;
        }
        String motivo = "Ocultada automáticamente al recibir " + pendientes.size() + " denuncias de la comunidad";
        publicacionService.cambiarEstado(p, EstadoPublicacion.MODERADA, null, motivo);
        pendientes.forEach(d -> {
            d.resolverPorSistema(AccionModeracion.OCULTAR, motivo);
            historial.registrar(EntidadHistorial.DENUNCIA, d.getId(), EstadoDenuncia.PENDIENTE, d.getEstado(), null, motivo);
        });
        notificaciones.notificar(p.getAutorId(), TipoNotificacion.MODERACION, "Tu publicación fue ocultada",
                "Varios vecinos la denunciaron. Ya no es visible para la comunidad.", "PUBLICACION", p.getId());
        log.info("MODERACION publicacion={} ocultada con {} denuncias", p.getId(), pendientes.size());
    }
}
