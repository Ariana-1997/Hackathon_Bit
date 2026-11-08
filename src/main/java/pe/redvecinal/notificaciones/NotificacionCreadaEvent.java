package pe.redvecinal.notificaciones;

import java.util.UUID;

public record NotificacionCreadaEvent(UUID notificacionId, UUID usuarioId, TipoNotificacion tipo, String titulo,
                                      String cuerpo, String entidadTipo, UUID entidadId) {}
