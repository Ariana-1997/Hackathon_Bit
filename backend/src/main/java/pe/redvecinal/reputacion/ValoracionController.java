package pe.redvecinal.reputacion;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.reputacion.ValoracionDtos.ValoracionRequest;
import pe.redvecinal.reputacion.ValoracionDtos.ValoracionResponse;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

@Tag(name = "5. Reputación")
@RestController
@RequiredArgsConstructor
public class ValoracionController {

    private final ValoracionService service;

    @Operation(summary = "RF41/RF42 Valorar un servicio (misma zona, no propio)")
    @PostMapping("/api/v1/servicios/{servicioId}/valoraciones")
    @ResponseStatus(HttpStatus.CREATED)
    public ValoracionResponse crear(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID servicioId,
                                    @Valid @RequestBody ValoracionRequest req) {
        return service.crear(yo, servicioId, req);
    }

    @Operation(summary = "Reseñas visibles de un servicio")
    @GetMapping("/api/v1/servicios/{servicioId}/valoraciones")
    public PageResponse<ValoracionResponse> listar(@PathVariable UUID servicioId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return service.listar(servicioId, PageResponse.pagina(page, size));
    }

    @Operation(summary = "Editar mi valoración")
    @PutMapping("/api/v1/valoraciones/{id}")
    public ValoracionResponse actualizar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                         @Valid @RequestBody ValoracionRequest req) {
        return service.actualizar(yo, id, req);
    }

    @Operation(summary = "Eliminar mi valoración")
    @DeleteMapping("/api/v1/valoraciones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        service.eliminar(yo, id);
    }

}
