package pe.redvecinal.usuarios.perfil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.shared.geo.Coordenada;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.usuarios.perfil.PerfilDtos.ActualizarPerfilRequest;
import pe.redvecinal.usuarios.perfil.PerfilDtos.PerfilResponse;
import pe.redvecinal.usuarios.perfil.PerfilDtos.ZonaResponse;

@Tag(name = "1. Perfil y comunidad")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;

    @Operation(summary = "RF02 Perfil del usuario con su rol y los módulos que puede ver")
    @GetMapping("/usuarios/me")
    public PerfilResponse yo(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return perfilService.obtener(yo.id());
    }

    @Operation(summary = "RF07 Editar nombre y teléfono")
    @PutMapping("/usuarios/me")
    public PerfilResponse actualizar(@AuthenticationPrincipal UsuarioAutenticado yo,
                                     @Valid @RequestBody ActualizarPerfilRequest req) {
        return perfilService.actualizar(yo.id(), req);
    }

    @Operation(summary = "RF09/RF10 Registrar ubicación GPS y asociar zona automáticamente")
    @PutMapping("/usuarios/me/ubicacion")
    public PerfilResponse ubicacion(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody Coordenada c) {
        return perfilService.actualizarUbicacion(yo.id(), c);
    }

    @Operation(summary = "RF49 Marcar el tutorial como completado")
    @PutMapping("/usuarios/me/tutorial")
    public ResponseEntity<Void> tutorial(@AuthenticationPrincipal UsuarioAutenticado yo) {
        perfilService.completarTutorial(yo.id());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Zonas/comunidades activas")
    @GetMapping("/zonas")
    public List<ZonaResponse> zonas() {
        return perfilService.zonasActivas();
    }
}
