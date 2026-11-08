package pe.redvecinal.emergencias;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.redvecinal.emergencias.EmergenciaDtos.EventoDashboard;
import pe.redvecinal.shared.config.AppProperties;

/**
 * RF31/RF35: "transmisión inmediata al panel central" con Server-Sent Events.
 * Se usa SSE (y no Supabase Realtime) porque bd_v2 cierra la Data API con RLS: solo el backend lee la BD.
 * Limitación: suscripciones en memoria -> con varias instancias usar Redis Pub/Sub o LISTEN/NOTIFY de Postgres.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmergenciaStreamService {

    /** Clave null-safe para administradores globales (ven todas las zonas). */
    private static final UUID TODAS = new UUID(0, 0);

    private final Map<UUID, Set<SseEmitter>> suscriptores = new ConcurrentHashMap<>();
    private final AppProperties props;

    public SseEmitter suscribir(UUID zonaId) {
        UUID clave = zonaId == null ? TODAS : zonaId;
        SseEmitter emitter = new SseEmitter(props.emergencias().sseTimeoutMs());
        Set<SseEmitter> set = suscriptores.computeIfAbsent(clave, k -> ConcurrentHashMap.newKeySet());
        set.add(emitter);
        Runnable quitar = () -> set.remove(emitter);
        emitter.onCompletion(quitar);
        emitter.onTimeout(quitar);
        emitter.onError(e -> quitar.run());
        enviar(emitter, set, SseEmitter.event().name("conectado").data("ok"));
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void alActualizarReporte(ReporteActualizadoEvent e) {
        EventoDashboard payload = new EventoDashboard(e.evento(), e.reporte());
        difundir(suscriptores.get(e.zonaId()), payload);
        difundir(suscriptores.get(TODAS), payload);
    }

    /** Mantiene viva la conexión a través de proxies (comentario SSE cada 25 s). */
    @Scheduled(fixedRate = 25_000)
    public void latido() {
        suscriptores.values().forEach(set -> set.forEach(em -> enviar(em, set, SseEmitter.event().comment("ping"))));
    }

    private void difundir(Set<SseEmitter> set, EventoDashboard payload) {
        if (set == null) {
            return;
        }
        set.forEach(em -> enviar(em, set, SseEmitter.event().name("reporte").id(payload.reporte().id().toString()).data(payload)));
    }

    private void enviar(SseEmitter em, Set<SseEmitter> set, SseEmitter.SseEventBuilder evento) {
        try {
            em.send(evento);
        } catch (IOException | IllegalStateException ex) {
            set.remove(em);
            log.debug("Cliente SSE desconectado");
        }
    }
}
