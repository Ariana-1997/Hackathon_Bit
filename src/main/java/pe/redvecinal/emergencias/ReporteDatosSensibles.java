package pe.redvecinal.emergencias;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

/** Ubicación EXACTA y datos de personas vulnerables (RF32, RF33). Solo ADMIN (RNF-20). */
@Entity
@Table(name = "det_reporte_datos_sensibles")
@Getter
@Setter
@NoArgsConstructor
public class ReporteDatosSensibles {

    @Id
    @Column(name = "reporte_id")
    private UUID reporteId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporte_id")
    private ReporteHumanitario reporte;

    @Column(name = "ubicacion_exacta", nullable = false, columnDefinition = "geography(Point,4326)")
    private Point ubicacionExacta;

    @Column(name = "direccion_texto", length = 255)
    private String direccionTexto;

    @Column(name = "nombre_persona", length = 120)
    private String nombrePersona;

    @Column(length = 60)
    private String contacto;

    @Column(name = "detalle_vulnerabilidad", columnDefinition = "text")
    private String detalleVulnerabilidad;
}
