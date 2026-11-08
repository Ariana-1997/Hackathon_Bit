package pe.redvecinal.emergencias;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** RF34 - prueba unitaria del módulo crítico de emergencias (RNF-47). */
class PrioridadCalculatorTest {

    private final PrioridadCalculator calculator = new PrioridadCalculator();

    @Test
    void alertaMedicaConMuchasPersonasVulnerablesEsCritica() {
        assertThat(calculator.calcular(TipoReporte.ALERTA_EMERGENCIA, "ATENCION_MEDICA", (short) 12, true))
                .isEqualTo(PrioridadEmergencia.CRITICA);
    }

    @Test
    void necesidadDeAguaParaUnaFamiliaEsAlta() {
        assertThat(calculator.calcular(TipoReporte.NECESIDAD_CRITICA, "AGUA", (short) 5, false))
                .isEqualTo(PrioridadEmergencia.ALTA);
    }

    @Test
    void necesidadNoVitalDeUnaPersonaEsBaja() {
        assertThat(calculator.calcular(TipoReporte.NECESIDAD_CRITICA, "HIGIENE", (short) 1, false))
                .isEqualTo(PrioridadEmergencia.BAJA);
    }

    @Test
    void alertaSinMasDatosEsMedia() {
        assertThat(calculator.calcular(TipoReporte.ALERTA_EMERGENCIA, "ABRIGO", null, false))
                .isEqualTo(PrioridadEmergencia.MEDIA);
    }
}
