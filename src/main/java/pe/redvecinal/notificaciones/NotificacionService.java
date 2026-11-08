package pe.redvecinal.notificaciones;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.web.PageResponse;

/**
 * RF48: la notificación se guarda en la misma transacción que el hecho que la origina y el push
 * se despacha DESPUÉS del commit, de forma asíncrona: si el push falla, el negocio no se revierte (RNF-22).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificaciones;
    private final SuscripcionPushRepository suscripciones;
    private final ApplicationEventPublisher eventos;
    private final PushSender pushSender;

    @Transactional
    public void notificar(UUID usuarioId, TipoNotificacion tipo, String titulo, String cuerpo,
                          String entidadTipo, UUID entidadId) {
        Notificacion n = new Notificacion();
        n.setUsuarioId(usuarioId);
        n.setTipo(tipo);
        n.setTitulo(recortar(titulo, 120));
        n.setCuerpo(recortar(cuerpo, 300));
        n.setEntidadTipo(entidadTipo);
        n.setEntidadId(entidadId);
        notificaciones.save(n);
        eventos.publishEvent(new NotificacionCreadaEvent(n.getId(), usuarioId, tipo, n.getTitulo(), n.getCuerpo(),
                entidadTipo, entidadId));
    }

    @Transactional
    public void notificarVarios(Collection<UUID> usuarios, TipoNotificacion tipo, String titulo, String cuerpo,
                                String entidadTipo, UUID entidadId) {
        usuarios.forEach(u -> notificar(u, tipo, titulo, cuerpo, entidadTipo, entidadId));
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void despacharPush(NotificacionCreadaEvent e) {
        List<SuscripcionPush> destinos = suscripciones.findByUsuarioIdAndActivaTrue(e.usuarioId());
        boolean alguna = false;
        String url = e.entidadTipo() == null ? "/" : "/" + e.entidadTipo().toLowerCase() + "/" + e.entidadId();
        for (SuscripcionPush s : destinos) {
            try {
                alguna |= pushSender.enviar(s, e.titulo(), e.cuerpo(), url);
            } catch (Exception ex) {
                log.warn("Fallo enviando push a la suscripción {}", s.getId(), ex);
            }
        }
        if (alguna) {
            notificaciones.marcarPushEnviada(e.notificacionId());
        }
    }

    public record NotificacionResponse(UUID id, TipoNotificacion tipo, String titulo, String cuerpo, String entidadTipo,
                                       UUID entidadId, boolean leida, OffsetDateTime createdAt) {}

    @Transactional(readOnly = true)
    public PageResponse<NotificacionResponse> listar(UUID usuarioId, Pageable pageable) {
        return PageResponse.de(notificaciones.findByUsuarioIdOrderByCreatedAtDesc(usuarioId, pageable),
                n -> new NotificacionResponse(n.getId(), n.getTipo(), n.getTitulo(), n.getCuerpo(), n.getEntidadTipo(),
                        n.getEntidadId(), n.getLeidaEn() != null, n.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public long noLeidas(UUID usuarioId) {
        return notificaciones.countByUsuarioIdAndLeidaEnIsNull(usuarioId);
    }

    @Transactional
    public void marcarLeida(UUID usuarioId, UUID id) {
        Notificacion n = notificaciones.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> ApiException.noEncontrado("La notificación"));
        if (n.getLeidaEn() == null) {
            n.setLeidaEn(OffsetDateTime.now());
        }
    }

    @Transactional
    public void marcarTodasLeidas(UUID usuarioId) {
        notificaciones.marcarTodasLeidas(usuarioId);
    }

    /** Alta o reactivación de la suscripción push del dispositivo. */
    @Transactional
    public void suscribir(UUID usuarioId, String endpoint, String p256dh, String auth, String userAgent) {
        SuscripcionPush s = suscripciones.findByEndpoint(endpoint).orElseGet(SuscripcionPush::new);
        s.setUsuarioId(usuarioId);
        s.setEndpoint(endpoint);
        s.setP256dh(p256dh);
        s.setAuth(auth);
        s.setUserAgent(recortar(userAgent, 255));
        s.setActiva(true);
        suscripciones.save(s);
    }

    @Transactional
    public void desuscribir(UUID usuarioId, String endpoint) {
        suscripciones.findByEndpoint(endpoint).filter(s -> s.getUsuarioId().equals(usuarioId))
                .ifPresent(s -> s.setActiva(false));
    }

    private static String recortar(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
