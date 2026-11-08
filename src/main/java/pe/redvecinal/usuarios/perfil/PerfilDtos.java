package pe.redvecinal.usuarios.perfil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;
import java.util.UUID;

public final class PerfilDtos {

    private PerfilDtos() {}

    public record ZonaResumen(UUID id, String codigo, String nombre) {}

    public record PerfilResponse(UUID id, String nombre, String telefono, ZonaResumen zona,
                                 Double lat, Double lng, boolean tutorialCompletado, Set<ModuloApp> modulos,
                                 Long version) {}

    /** RF07: nombre y teléfono de 9 dígitos. */
    public record ActualizarPerfilRequest(
            @NotBlank(message = "Ingresa tu nombre") @Size(max = 120, message = "Máximo 120 caracteres") String nombre,
            @Pattern(regexp = "^[0-9]{9}$", message = "El teléfono debe tener 9 dígitos") String telefono) {}

    public record ZonaResponse(UUID id, String codigo, String nombre, Double lat, Double lng, Integer radioM) {}
}
