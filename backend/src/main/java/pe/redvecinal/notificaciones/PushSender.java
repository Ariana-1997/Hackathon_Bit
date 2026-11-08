package pe.redvecinal.notificaciones;

/**
 * Envío de Web Push (RF48). Implementación por defecto: solo registra en log.
 * Para producción: implementar con VAPID (p. ej. librería nl.martijndwars:web-push) y marcar
 * la suscripción como inactiva si el navegador responde 404/410.
 */
public interface PushSender {

    /** @return true si se entregó al servicio push del navegador. */
    boolean enviar(SuscripcionPush destino, String titulo, String cuerpo, String urlDestino);
}
