package pe.redvecinal.reputacion;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class ValoracionDtos {

    private ValoracionDtos() {}

    /** RF41 puntuación 1..5 / RF42 reseña que justifica la experiencia. */
    public record ValoracionRequest(
            @NotNull(message = "Elige una puntuación") @Min(value = 1, message = "Mínimo 1 estrella")
            @Max(value = 5, message = "Máximo 5 estrellas") Short puntuacion,
            @Size(max = 1000, message = "Máximo 1000 caracteres") String comentario) {}

    public record ValoracionResponse(UUID id, Short puntuacion, String comentario, String autorNombre,
                                     OffsetDateTime createdAt) {}

}
