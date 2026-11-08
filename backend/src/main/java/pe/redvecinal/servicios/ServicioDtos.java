package pe.redvecinal.servicios;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import pe.redvecinal.publicaciones.EstadoPublicacion;

public final class ServicioDtos {

    private ServicioDtos() {}

    /** RF11 alta / RF13 edición. "id" opcional: UUID generado por el cliente para reintentos offline. */
    public record ServicioRequest(
            UUID id,
            @NotNull(message = "Selecciona una categoría") Integer categoriaId,
            @NotBlank(message = "Ingresa un título") @Size(min = 3, max = 160, message = "Entre 3 y 160 caracteres") String titulo,
            @NotBlank(message = "Describe tu servicio") @Size(max = 4000, message = "Máximo 4000 caracteres") String descripcion,
            @NotBlank(message = "Ingresa el nombre comercial") @Size(max = 120) String nombreComercial,
            @Size(max = 80) String marca,
            @Pattern(regexp = "^[0-9]{9}$", message = "El teléfono debe tener 9 dígitos") String telefonoContacto,
            @Size(max = 255) String direccionTexto,
            Map<String, Object> horario,
            @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
            @Digits(integer = 8, fraction = 2, message = "Precio inválido") BigDecimal precioDesde,
            @Size(max = 300) String tarifaDetalle,
            @NotNull(message = "Indica la ubicación del servicio")
            @DecimalMin("-90") @DecimalMax("90") Double lat,
            @NotNull(message = "Indica la ubicación del servicio")
            @DecimalMin("-180") @DecimalMax("180") Double lng,
            /** Para edición: versión que el cliente tenía (bloqueo optimista). */
            Long version) {}

    public record ServicioResumen(String id, String titulo, String nombreComercial, String marca, Integer categoriaId,
                                  String categoriaNombre, BigDecimal precioDesde, String moneda,
                                  BigDecimal promedioValoracion, Integer totalValoraciones, Double lat, Double lng,
                                  Double distanciaM, Badge badge) {}

    /** RF20: indicador visual en la ficha. */
    public enum Badge { NUEVO, RECOMENDADO, DESTACADO }

    public static Badge badge(BigDecimal promedio, Integer total) {
        if (total == null || total < 3) return Badge.NUEVO;
        if (promedio != null && promedio.compareTo(new BigDecimal("4.50")) >= 0 && total >= 10) return Badge.DESTACADO;
        if (promedio != null && promedio.compareTo(new BigDecimal("4.00")) >= 0) return Badge.RECOMENDADO;
        return null;
    }

    public record ServicioDetalle(UUID id, UUID autorId, String autorNombre, Integer categoriaId, String categoriaNombre,
                                  String titulo, String descripcion, String nombreComercial, String marca,
                                  String telefonoContacto, String direccionTexto, Map<String, Object> horario,
                                  BigDecimal precioDesde, String tarifaDetalle, String moneda,
                                  BigDecimal promedioValoracion, Integer totalValoraciones, Badge badge,
                                  Double lat, Double lng, EstadoPublicacion estado, Long version,
                                  OffsetDateTime createdAt) {}

    public record Sugerencia(String id, String nombreComercial, String titulo) {}

    public record CambiarEstadoRequest(@NotNull(message = "Indica si el servicio queda activo") Boolean activo) {}
}
