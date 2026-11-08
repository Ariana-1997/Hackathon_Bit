package pe.redvecinal.solidaridad;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.publicaciones.TipoPublicacion;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.CrearRequest;
import pe.redvecinal.solidaridad.SolidaridadDtos.Detalle;
import pe.redvecinal.solidaridad.SolidaridadDtos.FeedItem;
import pe.redvecinal.solidaridad.SolidaridadDtos.InteraccionRequest;
import pe.redvecinal.solidaridad.SolidaridadDtos.InteraccionResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.MiInteraccionResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.MiPublicacion;

@Tag(name = "3. Cadena de favores y solidaridad")
@Validated
@RestController
@RequestMapping("/api/v1/solidaridad")
@RequiredArgsConstructor
public class SolidaridadController {

    private final SolidaridadService service;

    @Operation(summary = "RF21/RF23-RF26 Publicar solicitud, préstamo, donación, habilidad o transporte")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Detalle crear(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody CrearRequest req) {
        return service.crear(yo, req);
    }

    @Operation(summary = "RF28/RF29 Bandeja de mi zona por fecha, filtrable por tipo")
    @GetMapping
    public PageResponse<FeedItem> feed(@AuthenticationPrincipal UsuarioAutenticado yo,
                                       @RequestParam(required = false) TipoPublicacion tipo,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return service.feed(yo.zonaObligatoria(), tipo, PageResponse.pagina(page, size));
    }

    @Operation(summary = "RF29 Publicaciones solidarias por cercanía")
    @GetMapping("/cercanas")
    public List<FeedItem> cercanas(@RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
                                   @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng,
                                   @RequestParam(defaultValue = "1") double radioKm,
                                   @RequestParam(required = false) TipoPublicacion tipo) {
        return service.cercanos(lat, lng, radioKm, tipo);
    }

    @Operation(summary = "RF28 Mis publicaciones solidarias")
    @GetMapping("/mias")
    public PageResponse<MiPublicacion> mias(@AuthenticationPrincipal UsuarioAutenticado yo,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return service.misPublicaciones(yo.id(), PageResponse.pagina(page, size));
    }

    @Operation(summary = "RF28 Ayudas que ofrecí")
    @GetMapping("/mis-interacciones")
    public PageResponse<MiInteraccionResponse> misInteracciones(@AuthenticationPrincipal UsuarioAutenticado yo,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "20") int size) {
        return service.misInteracciones(yo.id(), PageResponse.pagina(page, size));
    }

    @GetMapping("/{id}")
    public Detalle detalle(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        return service.detalle(id, yo.id());
    }

    @Operation(summary = "RF22/RF30 Quiero ayudar (botón rápido)")
    @PostMapping("/{id}/interacciones")
    @ResponseStatus(HttpStatus.CREATED)
    public InteraccionResponse postular(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                        @Valid @RequestBody(required = false) InteraccionRequest req) {
        return service.postular(yo, id, req);
    }

    @Operation(summary = "Respuestas recibidas (solo el autor)")
    @GetMapping("/{id}/interacciones")
    public List<InteraccionResponse> interacciones(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        return service.interaccionesDe(yo, id);
    }

    @PostMapping("/{id}/interacciones/{interaccionId}/aceptar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void aceptar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id, @PathVariable UUID interaccionId) {
        service.aceptar(yo, id, interaccionId);
    }

    @PostMapping("/{id}/interacciones/{interaccionId}/rechazar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rechazar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id, @PathVariable UUID interaccionId) {
        service.rechazar(yo, id, interaccionId);
    }

    @PostMapping("/{id}/interacciones/{interaccionId}/retirar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void retirar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id, @PathVariable UUID interaccionId) {
        service.retirar(yo, id, interaccionId);
    }

    @PostMapping("/{id}/completar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void completar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        service.completar(yo, id);
    }

    @PostMapping("/{id}/cancelar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        service.cancelar(yo, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        service.eliminar(yo, id);
    }
}
