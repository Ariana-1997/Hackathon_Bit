package pe.redvecinal.publicaciones;

/** Tipo PostgreSQL: tipo_publicacion. SERVICIO pertenece a ECONOMIA; el resto a SOLIDARIDAD. */
public enum TipoPublicacion {
    SERVICIO,
    SOLICITUD_AYUDA, PRESTAMO_HERRAMIENTA, DONACION_MATERIAL, INTERCAMBIO_HABILIDAD, TRANSPORTE_SOLIDARIO;

    public ModuloPublicacion modulo() {
        return this == SERVICIO ? ModuloPublicacion.ECONOMIA : ModuloPublicacion.SOLIDARIDAD;
    }
}
