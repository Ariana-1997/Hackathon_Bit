package pe.redvecinal.emergencias;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class EmergenciaDtos {

    private EmergenciaDtos() {}

    /**
     * RF31/RF32/RF33. lat/lng son OBLIGATORIAS (ubicación exacta). La descripción no debe incluir nombres,
     * direcciones ni teléfonos: esos datos van en "datosSensibles".
     */
    public record CrearReporteRequest(
            UUID id,
            @NotNull(message = "Indica si es alerta o necesidad crítica") TipoReporte tipo,
            @NotNull(message = "Elige qué se necesita") Integer categoriaId,
            @NotBlank(message = "Describe la situación") @Size(max = 1000) String descripcion,
            @Positive(message = "Debe ser mayor a 0") Short numeroPersonas,
            @NotNull(message = "La ubicación es obligatoria") @DecimalMin("-90") @DecimalMax("90") Double lat,
            @NotNull(message = "La ubicación es obligatoria") @DecimalMin("-180") @DecimalMax("180") Double lng,
            boolean anonimo,
            @Valid DatosSensiblesRequest datosSensibles) {}

    public record DatosSensiblesRequest(@Size(max = 255) String direccionTexto,
                                        @Size(max = 120) String nombrePersona,
                                        @Size(max = 60) String contacto,
                                        @Size(max = 2000) String detalleVulnerabilidad) {}

    /** Vista pública/dashboard: sin datos personales ni ubicación exacta (RF35, RNF-20). */
    public record ReportePublico(UUID id, TipoReporte tipo, Integer categoriaId, String categoriaNombre,
                                 String descripcion, Short numeroPersonas, Double lat, Double lng,
                                 PrioridadEmergencia prioridad, EstadoReporte estado, UUID responsableId,
                                 OffsetDateTime createdAt, OffsetDateTime cerradoEn, String motivoCierre, Long version) {}

    /** Solo ADMIN. */
    public record DatosSensiblesResponse(UUID reporteId, UUID reportanteId, Double latExacta, Double lngExacta,
                                         String direccionTexto, String nombrePersona, String contacto,
                                         String detalleVulnerabilidad) {}

    public record CambiarEstadoRequest(@NotNull EstadoReporte estado, @Size(max = 500) String motivo) {}

    /** RF39: cierre formal. */
    public record AtenderRequest(@NotBlank(message = "Describe cómo se atendió") @Size(max = 500) String motivo) {}

    public record RecursoRequest(
            @NotNull(message = "Elige la categoría") Integer categoriaId,
            @NotBlank @Size(max = 300) String descripcion,
            @Size(max = 30) String unidad,
            @NotNull @Min(value = 0, message = "No puede ser negativo") Integer cantidadTotal,
            @NotBlank(message = "Indica el almacén") @Size(max = 255) String almacenTexto,
            UUID zonaId) {}

    public record RecursoResponse(UUID id, UUID zonaId, Integer categoriaId, String categoriaNombre, String descripcion,
                                  String unidad, int cantidadTotal, int cantidadDisponible, String almacenTexto,
                                  Long version) {}

    public record AsignarRequest(UUID id, @NotNull UUID recursoId,
                                 @NotNull @Positive(message = "La cantidad debe ser mayor a 0") Integer cantidad) {}

    public record AsignacionResponse(UUID id, UUID reporteId, UUID recursoId, int cantidad, EstadoAsignacion estado,
                                     OffsetDateTime createdAt) {}

    public record CambiarAsignacionRequest(@NotNull EstadoAsignacion estado) {}

    /** Evento que viaja por SSE al dashboard. */
    public record EventoDashboard(String evento, ReportePublico reporte) {}
}
