package pe.redvecinal.emergencias;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import pe.redvecinal.emergencias.EmergenciaDtos.AtenderRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.CrearReporteRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.ReportePublico;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;

@Tag(name = "4. Ayuda humanitaria y emergencias")
@Validated
@RestController
@RequestMapping("/api/v1/emergencias")
@RequiredArgsConstructor
public class EmergenciaController {

    private final ReporteService reportes;
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
    public List<ReportePublico> dashboard(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return reportes.dashboard(yo.zonaObligatoria());
    }

    @Operation(summary = "RF35 Dashboard en tiempo real (Server-Sent Events)")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return stream.suscribir(yo.zonaObligatoria());
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

    @Operation(summary = "RF39 Marcar como 'Atendida' (solo el reportante)")
    @PostMapping("/reportes/{id}/atender")
    public ReportePublico atender(@AuthenticationPrincipal UsuarioAutenticado yo, @PathVariable UUID id,
                                  @Valid @RequestBody AtenderRequest req) {
        return reportes.atender(yo, id, req.motivo());
    }
}
