package pe.redvecinal.solidaridad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import pe.redvecinal.publicaciones.Publicacion;

/** Detalle 1:1 de publicaciones solidarias (det_solidaridad). Columnas nulas según el tipo (RF21-RF26). */
@Entity
@Table(name = "det_solidaridad")
@Getter
@Setter
@NoArgsConstructor
public class DetSolidaridad {

    @Id
    @Column(name = "publicacion_id")
    private UUID publicacionId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publicacion_id")
    private Publicacion publicacion;

    @Column(length = 1000)
    private String justificacion;            // RF21

    private Integer cantidad;                // RF23 stock

    @Column(length = 80)
    private String marca;                    // RF23

    @Column(name = "condiciones_uso", length = 500)
    private String condicionesUso;           // RF23 / estado del material (RF24)

    /** Rutas en Supabase Storage (bucket privado). Máx. 5 (CHECK en BD). RF24 */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "fotos_rutas", nullable = false, columnDefinition = "text[]")
    private List<String> fotosRutas = new ArrayList<>();

    @Column(name = "origen_texto", length = 200)
    private String origenTexto;              // RF26

    @Column(name = "destino_texto", length = 200)
    private String destinoTexto;             // RF26

    @Column(name = "fecha_salida")
    private OffsetDateTime fechaSalida;      // RF26

    private Short asientos;                  // RF26

    @Column(name = "fecha_necesaria")
    private LocalDate fechaNecesaria;

    @Column(name = "fecha_devolucion_prevista")
    private LocalDate fechaDevolucionPrevista;

    /** Se asigna con UPDATE condicional (una sola respuesta ganadora). Solo lectura para JPA. */
    @Column(name = "interaccion_aceptada_id", insertable = false, updatable = false)
    private UUID interaccionAceptadaId;
}
