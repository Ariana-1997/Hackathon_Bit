package pe.redvecinal.servicios;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.servicios.ServicioDtos.CambiarEstadoRequest;
import pe.redvecinal.servicios.ServicioDtos.ServicioDetalle;
import pe.redvecinal.servicios.ServicioDtos.ServicioRequest;
import pe.redvecinal.servicios.ServicioDtos.ServicioResumen;
import pe.redvecinal.servicios.ServicioDtos.Sugerencia;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

@Tag(name = "2. Servicios y economía local")
@Validated
@RestController
@RequestMapping("/api/v1/servicios")
@RequiredArgsConstructor
public class ServicioController {

    private final ServicioService servicioService;

    @Operation(summary = "RF15/RF17 Directorio de servicios activos de mi zona, con filtros")
    @GetMapping
    public PageResponse<ServicioResumen> catalogo(@AuthenticationPrincipal UsuarioAutenticado yo,
                                                  @RequestParam(required = false) UUID zonaId,
                                                  @RequestParam(required = false) Integer categoriaId,
                                                  @RequestParam(required = false) String marca,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        UUID zona = yo.esAdmin() && zonaId != null ? zonaId : yo.zonaObligatoria();
        return servicioService.catalogo(zona, categoriaId, marca, PageResponse.pagina(page, size));
    }

    @Operation(summary = "RF16 Autocompletado predictivo por nombre")
    @GetMapping("/autocompletar")
    public List<Sugerencia> autocompletar(@AuthenticationPrincipal UsuarioAutenticado yo, @RequestParam String q) {
        return servicioService.autocompletar(yo.zonaObligatoria(), q);
    }

    @Operation(summary = "RF18/RF19 Servicios dentro de un radio en km (para el mapa)")
    @GetMapping("/cercanos")
    public List<ServicioResumen> cercanos(@RequestParam @DecimalMin("-90") @DecimalMax("90") double lat,
                                          @RequestParam @DecimalMin("-180") @DecimalMax("180") double lng,
                                          @RequestParam(defaultValue = "2") double radioKm,
                                          @RequestParam(required = false) Integer categoriaId) {
        return servicioService.cercanos(lat, lng, radioKm, categoriaId);
    }

    @Operation(summary = "RF19/RF20/RF45 Ficha del servicio con valoración promedio y badge")
    @GetMapping("/{id}")
    public ServicioDetalle detalle(@PathVariable UUID id) {
        return servicioService.detalle(id);
    }

    @Operation(summary = "RF11 Registrar servicio u oficio")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PRESTADOR')")
    public ServicioDetalle crear(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody ServicioRequest req) {
        return servicioService.crear(yo, req);
    }

    @Operation(summary = "RF13 Editar servicio y tarifas")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PRESTADOR')")
    public ServicioDetalle actualizar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                      @Valid @RequestBody ServicioRequest req) {
        return servicioService.actualizar(yo, id, req);
    }

    @Operation(summary = "RF14 Activar o desactivar servicio")
    @PatchMapping("/{id}/estado")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarEstado(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                              @Valid @RequestBody CambiarEstadoRequest req) {
        servicioService.cambiarEstado(yo, id, req.activo());
    }

    @Operation(summary = "RF14 Baja lógica del servicio")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        servicioService.eliminar(yo, id);
    }
}
