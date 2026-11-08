package pe.redvecinal.emergencias;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class EstadoReporteTest {

    @Test
    void alCerrarSeCompletanLosCamposQueExigeLaBd() {
        ReporteHumanitario r = new ReporteHumanitario();
        UUID admin = UUID.randomUUID();
        r.transicionar(EstadoReporte.ATENDIDA, admin, "Se entregaron víveres");
        assertThat(r.getCerradoEn()).isNotNull();
        assertThat(r.getCerradoPorId()).isEqualTo(admin);
    }

    @Test
    void unReporteCerradoNoSeReabre() {
        ReporteHumanitario r = new ReporteHumanitario();
        r.transicionar(EstadoReporte.DESCARTADA, UUID.randomUUID(), "Duplicado");
        assertThatThrownBy(() -> r.transicionar(EstadoReporte.ABIERTA, UUID.randomUUID(), null))
                .isInstanceOf(IllegalStateException.class);
    }
}
