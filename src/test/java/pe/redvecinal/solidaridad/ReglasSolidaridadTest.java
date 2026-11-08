package pe.redvecinal.solidaridad;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import pe.redvecinal.publicaciones.TipoPublicacion;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.solidaridad.SolidaridadDtos.CrearRequest;

class ReglasSolidaridadTest {

    private final ReglasSolidaridad reglas = new ReglasSolidaridad();
    private final UUID autor = UUID.randomUUID();

    private CrearRequest solicitud(String justificacion, List<String> fotos) {
        return new CrearRequest(null, TipoPublicacion.SOLICITUD_AYUDA, null, "Necesito ayuda", "Detalle",
                null, null, null, justificacion, null, null, null, fotos, null, null, null, null, null, null);
    }

    @Test
    void laSolicitudDeAyudaExigeJustificacion() {
        assertThatThrownBy(() -> reglas.validar(solicitud(null, null), autor)).isInstanceOf(ApiException.class);
    }

    @Test
    void lasFotosDebenEstarEnLaCarpetaDelAutor() {
        assertThatThrownBy(() -> reglas.validar(solicitud("Motivo", List.of("otro/foto.jpg")), autor))
                .isInstanceOf(ApiException.class);
        reglas.validar(solicitud("Motivo", List.of(autor + "/foto.jpg")), autor);
    }

    @Test
    void categorizaAutomaticamenteSegunElTipo() {
        assertThat(reglas.codigoCategoriaPorDefecto(TipoPublicacion.TRANSPORTE_SOLIDARIO)).isEqualTo("TRANSPORTE");
    }
}
