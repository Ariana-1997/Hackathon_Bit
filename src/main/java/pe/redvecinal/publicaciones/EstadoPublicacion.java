package pe.redvecinal.publicaciones;

/** Tipo PostgreSQL: estado_publicacion */
public enum EstadoPublicacion {
    ACTIVA, INACTIVA, EN_CURSO, COMPLETADA, CANCELADA, EXPIRADA, MODERADA;

    public boolean esVisible() { return this == ACTIVA || this == EN_CURSO; }
}
