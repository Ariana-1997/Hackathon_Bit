package pe.redvecinal.emergencias;

import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * RF34: clasificación automática por prioridad. Regla por puntaje, explicable y fácil de ajustar
 * con los vecinos. Cubierta por PrioridadCalculatorTest.
 */
@Component
public class PrioridadCalculator {

    /** Códigos de def_categoria (ámbito NECESIDAD) que implican riesgo para la vida o la salud. */
    static final Set<String> CATEGORIAS_VITALES = Set.of("ATENCION_MEDICA", "MEDICAMENTOS", "AGUA", "ALBERGUE");

    public PrioridadEmergencia calcular(TipoReporte tipo, String codigoCategoria, Short numeroPersonas,
                                        boolean hayPersonasVulnerables) {
        int puntaje = 0;
        if (tipo == TipoReporte.ALERTA_EMERGENCIA) puntaje += 2;
        if (CATEGORIAS_VITALES.contains(codigoCategoria)) puntaje += 2;
        if (numeroPersonas != null) {
            if (numeroPersonas >= 10) puntaje += 2;
            else if (numeroPersonas >= 4) puntaje += 1;
        }
        if (hayPersonasVulnerables) puntaje += 1;

        if (puntaje >= 5) return PrioridadEmergencia.CRITICA;
        if (puntaje >= 3) return PrioridadEmergencia.ALTA;
        if (puntaje >= 1) return PrioridadEmergencia.MEDIA;
        return PrioridadEmergencia.BAJA;
    }
}
