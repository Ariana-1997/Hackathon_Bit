package pe.redvecinal.emergencias;

import java.util.EnumSet;
import java.util.Set;

/** Tipo PostgreSQL: estado_reporte, con sus transiciones válidas (RF38, RF39). */
public enum EstadoReporte {
    ABIERTA, EN_ATENCION, ATENDIDA, DESCARTADA;

    public Set<EstadoReporte> siguientesPermitidos() {
        return switch (this) {
            case ABIERTA -> EnumSet.of(EN_ATENCION, ATENDIDA, DESCARTADA);
            case EN_ATENCION -> EnumSet.of(ABIERTA, ATENDIDA, DESCARTADA);
            case ATENDIDA, DESCARTADA -> EnumSet.noneOf(EstadoReporte.class);
        };
    }

    public boolean esCierre() { return this == ATENDIDA || this == DESCARTADA; }
}
