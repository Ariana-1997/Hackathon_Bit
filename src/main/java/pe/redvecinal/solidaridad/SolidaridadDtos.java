package pe.redvecinal.solidaridad;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.TipoPublicacion;

public final class SolidaridadDtos {

    private SolidaridadDtos() {}

    /**
     * Un único formulario para los 5 tipos (RF21-RF26). Para cumplir RNF-32 (≤ 3 interacciones) la categoría
     * y la ubicación son opcionales: se deducen del tipo (RF27) y del perfil del vecino.
     */
    public record CrearRequest(
            UUID id,
            @NotNull(message = "Elige el tipo de publicación") TipoPublicacion tipo,
            Integer categoriaId,
            @NotBlank(message = "Ingresa un título") @Size(min = 3, max = 160, message = "Entre 3 y 160 caracteres") String titulo,
            @NotBlank(message = "Describe lo que necesitas u ofreces") @Size(max = 4000) String descripcion,
            @DecimalMin("-90") @DecimalMax("90") Double lat,
            @DecimalMin("-180") @DecimalMax("180") Double lng,
            OffsetDateTime expiraEn,
            @Size(max = 1000) String justificacion,
            @Positive(message = "La cantidad debe ser mayor a 0") Integer cantidad,
            @Size(max = 80) String marca,
            @Size(max = 500) String condicionesUso,
            @Size(max = 5, message = "Máximo 5 fotos") List<String> fotosRutas,
            @Size(max = 200) String origenTexto,
            @Size(max = 200) String destinoTexto,
            OffsetDateTime fechaSalida,
            @Min(value = 1, message = "Al menos 1 asiento") @Max(value = 20, message = "Máximo 20 asientos") Short asientos,
            LocalDate fechaNecesaria,
            LocalDate fechaDevolucionPrevista) {}

    public record FeedItem(String id, TipoPublicacion tipo, String titulo, String resumen, String categoriaNombre,
                           EstadoPublicacion estado, String autorNombre, Double lat, Double lng, Double distanciaM,
                           Instant createdAt) {}

    public record Detalle(UUID id, TipoPublicacion tipo, Integer categoriaId, String categoriaNombre, String titulo,
                          String descripcion, UUID autorId, String autorNombre, EstadoPublicacion estado,
                          Double lat, Double lng, OffsetDateTime expiraEn, String justificacion, Integer cantidad,
                          String marca, String condicionesUso, Map<String, String> fotos, String origenTexto,
                          String destinoTexto, OffsetDateTime fechaSalida, Short asientos, LocalDate fechaNecesaria,
                          LocalDate fechaDevolucionPrevista, UUID interaccionAceptadaId, Long version,
                          OffsetDateTime createdAt) {}

    public record MiPublicacion(UUID id, TipoPublicacion tipo, String titulo, EstadoPublicacion estado,
                                OffsetDateTime createdAt) {}

    /** RF22 / RF30: "Quiero ayudar" (el mensaje es opcional para que sea un solo toque). */
    public record InteraccionRequest(UUID id, @Size(max = 1000) String mensaje) {}

    public record InteraccionResponse(UUID id, UUID usuarioId, String usuarioNombre, EstadoInteraccion estado,
                                      String mensaje, OffsetDateTime createdAt) {}

    public record MiInteraccionResponse(UUID id, UUID publicacionId, TipoPublicacion tipo, String titulo,
                                        EstadoPublicacion estadoPublicacion, EstadoInteraccion estado,
                                        OffsetDateTime createdAt) {}
}
