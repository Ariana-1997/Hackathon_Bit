package pe.redvecinal.shared.geo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Point;

class GeoUtilsTest {

    @Test
    void elPuntoUsaLongitudComoXyLatitudComoY() {
        Point p = GeoUtils.punto(-12.0464, -77.0428);   // Lima
        assertThat(p.getX()).isEqualTo(-77.0428);
        assertThat(p.getY()).isEqualTo(-12.0464);
        assertThat(p.getSRID()).isEqualTo(4326);
    }

    @Test
    void laUbicacionAproximadaRedondeaATresDecimales() {
        Point p = GeoUtils.aproximado(-12.046374, -77.042793, 3);
        assertThat(GeoUtils.lat(p)).isEqualTo(-12.046);
        assertThat(GeoUtils.lng(p)).isEqualTo(-77.043);
    }

    @Test
    void rechazaCoordenadasFueraDeRango() {
        assertThatThrownBy(() -> GeoUtils.punto(95, 0)).isInstanceOf(IllegalArgumentException.class);
    }
}
