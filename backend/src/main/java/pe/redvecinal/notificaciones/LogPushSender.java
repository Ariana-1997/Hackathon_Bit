package pe.redvecinal.notificaciones;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LogPushSender implements PushSender {

    @Override
    public boolean enviar(SuscripcionPush destino, String titulo, String cuerpo, String urlDestino) {
        log.info("[push simulado] usuario={} titulo='{}' url={}", destino.getUsuarioId(), titulo, urlDestino);
        return true;
    }
}
