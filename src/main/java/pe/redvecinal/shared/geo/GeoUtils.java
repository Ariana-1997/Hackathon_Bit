package pe.redvecinal.shared.geo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

/** Utilidades PostGIS. Ojo: JTS usa (x = longitud, y = latitud). SRID 4326 (WGS84 / GPS). */
public final class GeoUtils {

    public static final int SRID = 4326;
    private static final GeometryFactory FACTORY = new GeometryFactory(new PrecisionModel(), SRID);

    private GeoUtils() {}

    public static Point punto(double lat, double lng) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Coordenadas fuera de rango");
        }
        Point p = FACTORY.createPoint(new Coordinate(lng, lat));
        p.setSRID(SRID);
        return p;
    }

    /** Redondea para no exponer la ubicación exacta (3 decimales ≈ 110 m). RF09 / RNF-20. */
    public static Point aproximado(double lat, double lng, int decimales) {
        return punto(redondear(lat, decimales), redondear(lng, decimales));
    }

    public static Double lat(Point p) { return p == null ? null : p.getY(); }

    public static Double lng(Point p) { return p == null ? null : p.getX(); }

    private static double redondear(double valor, int decimales) {
        return BigDecimal.valueOf(valor).setScale(decimales, RoundingMode.HALF_UP).doubleValue();
    }
}
