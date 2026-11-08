package pe.redvecinal.usuarios.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.redvecinal.usuarios.perfil.PerfilDtos.PerfilResponse;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank(message = "Ingresa tu correo") @Email(message = "El correo no es válido") String email,
            @NotBlank(message = "Ingresa tu contraseña") String password) {}

    public record RegistroRequest(
            @NotBlank(message = "Ingresa tu correo") @Email(message = "El correo no es válido") String email,
            @NotBlank(message = "Ingresa una contraseña")
            @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres") String password,
            @NotBlank(message = "Ingresa tu nombre") @Size(max = 120, message = "Máximo 120 caracteres") String nombre,
            @Pattern(regexp = "^[0-9]{9}$", message = "El teléfono debe tener 9 dígitos") String telefono) {}

    public record RefreshRequest(@NotBlank(message = "Falta el refresh token") String refreshToken) {}

    public record RecuperarRequest(
            @NotBlank(message = "Ingresa tu correo") @Email(message = "El correo no es válido") String email) {}

    /** El frontend guarda los tokens; en el logout los destruye localmente (RF03). */
    public record SesionResponse(String accessToken, String refreshToken, long expiresIn, String tokenType,
                                 PerfilResponse perfil) {}
}
