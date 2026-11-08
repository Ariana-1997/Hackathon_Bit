package pe.redvecinal.moderacion;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaRequest;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaResponse;
import pe.redvecinal.moderacion.ModeracionDtos.ModerarPublicacionRequest;
import pe.redvecinal.moderacion.ModeracionDtos.ResolverRequest;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

@Tag(name = "5. Moderación")
@RestController
@RequiredArgsConstructor
public class ModeracionController {

    private final ModeracionService service;

    @Operation(summary = "RF46 Reportar publicación o comportamiento inapropiado")
    @PostMapping("/api/v1/denuncias")
    @ResponseStatus(HttpStatus.CREATED)
    public DenunciaResponse denunciar(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody DenunciaRequest req) {
        return service.denunciar(yo, req);
    }

    @Operation(summary = "Admin: bandeja de denuncias")
    @GetMapping("/api/v1/admin/denuncias")
    public PageResponse<DenunciaResponse> listar(@RequestParam(defaultValue = "PENDIENTE") EstadoDenuncia estado,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        return service.listar(estado, PageResponse.pagina(page, size));
    }

    @Operation(summary = "Admin RF47: resolver denuncia con justificación obligatoria")
    @PostMapping("/api/v1/admin/denuncias/{id}/resolver")
    public DenunciaResponse resolver(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                     @Valid @RequestBody ResolverRequest req) {
        return service.resolver(yo, id, req);
    }

    @Operation(summary = "Admin RF47: moderar o dar de baja una publicación")
    @PostMapping("/api/v1/admin/publicaciones/{id}/moderar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void moderar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                        @Valid @RequestBody ModerarPublicacionRequest req) {
        service.moderarPublicacion(yo, id, req.accion(), req.justificacion());
    }
}
