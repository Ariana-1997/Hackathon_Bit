package pe.redvecinal.moderacion;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaRequest;
import pe.redvecinal.moderacion.ModeracionDtos.DenunciaResponse;
import pe.redvecinal.shared.security.UsuarioAutenticado;

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

}
