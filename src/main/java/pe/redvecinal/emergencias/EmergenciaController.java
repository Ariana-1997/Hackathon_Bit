package pe.redvecinal.emergencias;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.redvecinal.emergencias.EmergenciaDtos.AsignacionResponse;
import pe.redvecinal.emergencias.EmergenciaDtos.AsignarRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.AtenderRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.CambiarAsignacionRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.CambiarEstadoRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.CrearReporteRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.DatosSensiblesResponse;
import pe.redvecinal.emergencias.EmergenciaDtos.RecursoRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.RecursoResponse;
import pe.redvecinal.emergencias.EmergenciaDtos.ReportePublico;
import pe.redvecinal.shared.historial.HistorialService;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

@Tag(name = "4. Ayuda humanitaria y emergencias")
@Validated
@RestController
@RequestMapping("/api/v1/emergencias")
@RequiredArgsConstructor
public class EmergenciaController {

    private final ReporteService reportes;
    private final RecursoService recursos;
    private final EmergenciaStreamService stream;

    // ---------------- Reportes ----------------

    @Operation(summary = "RF31/RF32/RF33 Registrar alerta o necesidad crítica (ubicación obligatoria)")
    @PostMapping("/reportes")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportePublico crear(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody CrearReporteRequest req) {
        return reportes.crear(yo, req);
    }

    @Operation(summary = "RF35 Dashboard: alertas abiertas/en atención de la zona (sin datos sensibles)")
    @GetMapping("/dashboard")
    public List<ReportePublico> dashboard(@AuthenticationPrincipal UsuarioAutenticado yo,
                                          @RequestParam(required = false) UUID zonaId) {
        return reportes.dashboard(yo.esAdmin() && zonaId != null ? zonaId : yo.zonaObligatoria());
    }

    @Operation(summary = "RF35 Dashboard en tiempo real (Server-Sent Events)")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UsuarioAutenticado yo, @RequestParam(required = false) UUID zonaId) {
        UUID zona = yo.esAdmin() ? (zonaId != null ? zonaId : yo.zonaId()) : yo.zonaObligatoria();
        return stream.suscribir(zona);
    }

    @GetMapping("/reportes/mios")
    public PageResponse<ReportePublico> mios(@AuthenticationPrincipal UsuarioAutenticado yo,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return reportes.misReportes(yo.id(), PageResponse.pagina(page, size));
    }

    @GetMapping("/reportes/{id}")
    public ReportePublico detalle(@PathVariable UUID id) {
        return reportes.detalle(id);
    }

    @Operation(summary = "RF39 Marcar como 'Atendida' (admin o reportante)")
    @PostMapping("/reportes/{id}/atender")
    public ReportePublico atender(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                  @Valid @RequestBody AtenderRequest req) {
        return reportes.atender(yo, id, req.motivo());
    }

    @Operation(summary = "Admin RNF-20: datos sensibles y ubicación exacta")
    @GetMapping("/reportes/{id}/sensibles")
    @PreAuthorize("hasRole('ADMIN')")
    public DatosSensiblesResponse sensibles(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id) {
        return reportes.datosSensibles(yo, id);
    }

    @Operation(summary = "Admin RF37/RF38: cambiar estado (EN_ATENCION, ABIERTA, DESCARTADA)")
    @PatchMapping("/reportes/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ReportePublico cambiarEstado(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                        @Valid @RequestBody CambiarEstadoRequest req) {
        return reportes.cambiarEstado(yo, id, req.estado(), req.motivo());
    }

    @Operation(summary = "Admin RF40: traza inalterable de la alerta")
    @GetMapping("/reportes/{id}/historial")
    @PreAuthorize("hasRole('ADMIN')")
    public List<HistorialService.Item> historial(@PathVariable UUID id) {
        return reportes.historial(id);
    }

    @Operation(summary = "Admin RF40: alertas pasadas (cerradas)")
    @GetMapping("/reportes/cerrados")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ReportePublico> cerrados(@RequestParam(required = false) UUID zonaId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        return reportes.cerrados(zonaId, PageResponse.pagina(page, size));
    }

    // ---------------- Recursos ----------------

    @Operation(summary = "RF36 Registrar recursos de almacenes comunales")
    @PostMapping("/recursos")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','PRESTADOR')")
    public RecursoResponse crearRecurso(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody RecursoRequest req) {
        return recursos.crear(yo, req);
    }

    @GetMapping("/recursos")
    @PreAuthorize("hasAnyRole('ADMIN','PRESTADOR')")
    public List<RecursoResponse> listarRecursos(@AuthenticationPrincipal UsuarioAutenticado yo,
                                                @RequestParam(required = false) UUID zonaId) {
        return recursos.listar(yo.esAdmin() && zonaId != null ? zonaId : yo.zonaObligatoria());
    }

    @PatchMapping("/recursos/{id}/total")
    @PreAuthorize("hasRole('ADMIN')")
    public RecursoResponse ajustarTotal(@PathVariable UUID id, @RequestParam @Min(0) int total) {
        return recursos.ajustarTotal(id, total);
    }

    @Operation(summary = "Admin RF37: asignar recurso a una emergencia abierta")
    @PostMapping("/reportes/{id}/asignaciones")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AsignacionResponse asignar(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                      @Valid @RequestBody AsignarRequest req) {
        return recursos.asignar(yo, id, req);
    }

    @GetMapping("/reportes/{id}/asignaciones")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AsignacionResponse> asignaciones(@PathVariable UUID id) {
        return recursos.asignacionesDe(id);
    }

    @PatchMapping("/asignaciones/{asignacionId}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public AsignacionResponse cambiarAsignacion(@AuthenticationPrincipal UsuarioAutenticado yo,
                                                @PathVariable UUID asignacionId,
                                                @Valid @RequestBody CambiarAsignacionRequest req) {
        return recursos.cambiarEstadoAsignacion(yo, asignacionId, req.estado());
    }
}
