package pe.redvecinal.usuarios.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.shared.security.UsuarioAuthenticationToken;
import pe.redvecinal.usuarios.auth.AuthDtos.LoginRequest;
import pe.redvecinal.usuarios.auth.AuthDtos.RecuperarRequest;
import pe.redvecinal.usuarios.auth.AuthDtos.RefreshRequest;
import pe.redvecinal.usuarios.auth.AuthDtos.RegistroRequest;
import pe.redvecinal.usuarios.auth.AuthDtos.SesionResponse;

@Tag(name = "1. Acceso")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "RF01/RF06 Iniciar sesión con correo y contraseña (bloqueo tras 3 fallos)")
    @PostMapping("/login")
    public SesionResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @Operation(summary = "Registrar vecino o prestador")
    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, UUID> registrar(@Valid @RequestBody RegistroRequest req) {
        return Map.of("usuarioId", authService.registrar(req));
    }

    @Operation(summary = "Renovar el access token (también usado tras validar biometría en el dispositivo, RF05)")
    @PostMapping("/refresh")
    public SesionResponse refrescar(@Valid @RequestBody RefreshRequest req) {
        return authService.refrescar(req.refreshToken());
    }

    @Operation(summary = "RF04 Enviar enlace temporal de recuperación de contraseña")
    @PostMapping("/recuperar")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void recuperar(@Valid @RequestBody RecuperarRequest req) {
        authService.recuperar(req.email());
    }

    @Operation(summary = "RF03 Cerrar sesión (revoca el refresh token; el cliente borra sus tokens)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(UsuarioAuthenticationToken auth) {
        authService.cerrarSesion(auth.getToken().getTokenValue());
        return ResponseEntity.noContent().build();
    }
}
