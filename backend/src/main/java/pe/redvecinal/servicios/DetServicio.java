package pe.redvecinal.servicios;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import pe.redvecinal.publicaciones.Publicacion;

/** Detalle 1:1 de una publicación tipo SERVICIO (det_servicio). RF11, RF13, RF17, RF20, RF45. */
@Entity
@Table(name = "det_servicio")
@Getter
@Setter
@NoArgsConstructor
public class DetServicio {

    @Id
    @Column(name = "publicacion_id")
    private UUID publicacionId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publicacion_id")
    private Publicacion publicacion;

    @Column(name = "nombre_comercial", nullable = false, length = 120)
    private String nombreComercial;

    @Column(length = 80)
    private String marca;

    @Column(name = "telefono_contacto", length = 9)
    private String telefonoContacto;

    @Column(name = "direccion_texto", length = 255)
    private String direccionTexto;

    /** Ej.: {"lun-vie":"08:00-18:00","sab":"09:00-13:00"} */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> horario;

    @Column(name = "precio_desde", precision = 10, scale = 2)
    private BigDecimal precioDesde;

    @Column(name = "tarifa_detalle", length = 300)
    private String tarifaDetalle;

    @Column(nullable = false, length = 3)
    private String moneda = "PEN";

    /** Mantenidos por el trigger trg_valoracion_reputacion (RF45): solo lectura para JPA. */
    @Column(name = "promedio_valoracion", insertable = false, updatable = false)
    private BigDecimal promedioValoracion;

    @Column(name = "total_valoraciones", insertable = false, updatable = false)
    private Integer totalValoraciones;
}
