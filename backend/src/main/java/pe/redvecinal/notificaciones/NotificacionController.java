package pe.redvecinal.notificaciones;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.notificaciones.NotificacionService.NotificacionResponse;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

@Tag(name = "5. Notificaciones")
@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService service;

    public record SuscripcionRequest(@NotBlank @Size(max = 2000) String endpoint,
                                     @NotBlank @Size(max = 255) String p256dh,
                                     @NotBlank @Size(max = 255) String auth) {}

    @Operation(summary = "Mis notificaciones")
    @GetMapping
    public PageResponse<NotificacionResponse> listar(@AuthenticationPrincipal UsuarioAutenticado yo,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        return service.listar(yo.id(), PageResponse.pagina(page, size));
    }

    @Operation(summary = "Cantidad de notificaciones sin leer")
    @GetMapping("/no-leidas")
    public Map<String, Long> noLeidas(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return Map.of("total", service.noLeidas(yo.id()));
    }

    @PatchMapping("/{id}/leida")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leida(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        service.marcarLeida(yo.id(), id);
    }

    @PatchMapping("/leidas")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void todasLeidas(@AuthenticationPrincipal UsuarioAutenticado yo) {
        service.marcarTodasLeidas(yo.id());
    }

    @Operation(summary = "RF48 Registrar la suscripción Web Push del dispositivo")
    @PostMapping("/suscripciones")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suscribir(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody SuscripcionRequest req,
                          @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        service.suscribir(yo.id(), req.endpoint(), req.p256dh(), req.auth(), userAgent);
    }

    @DeleteMapping("/suscripciones")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desuscribir(@AuthenticationPrincipal UsuarioAutenticado yo, @RequestParam String endpoint) {
        service.desuscribir(yo.id(), endpoint);
    }
}
