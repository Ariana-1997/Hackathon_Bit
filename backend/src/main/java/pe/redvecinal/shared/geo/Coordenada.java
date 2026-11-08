package pe.redvecinal.shared.geo;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/** Par latitud/longitud recibido desde el GPS del dispositivo. */
public record Coordenada(
        @NotNull(message = "La latitud es obligatoria")
        @DecimalMin(value = "-90", message = "Latitud inválida") @DecimalMax(value = "90", message = "Latitud inválida")
        Double lat,
        @NotNull(message = "La longitud es obligatoria")
        @DecimalMin(value = "-180", message = "Longitud inválida") @DecimalMax(value = "180", message = "Longitud inválida")
        Double lng) {
}
