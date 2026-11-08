package pe.redvecinal.emergencias;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.catalogo.AmbitoCategoria;
import pe.redvecinal.catalogo.CatalogoService;
import pe.redvecinal.emergencias.EmergenciaDtos.AsignacionResponse;
import pe.redvecinal.emergencias.EmergenciaDtos.AsignarRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.RecursoRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.RecursoResponse;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;
import pe.redvecinal.shared.security.UsuarioAutenticado;

/** RF36 (inventario comunal) y RF37 (asignación remota de recursos a emergencias). */
@Service
@RequiredArgsConstructor
public class RecursoService {

    private final RecursoRepository recursos;
    private final AsignacionRepository asignaciones;
    private final ReporteService reporteService;
    private final CatalogoService catalogo;
    private final HistorialService historial;
    private final NotificacionService notificaciones;

    @Transactional
    public RecursoResponse crear(UsuarioAutenticado yo, RecursoRequest req) {
        catalogo.validar(req.categoriaId(), AmbitoCategoria.RECURSO);
        Recurso r = new Recurso();
        r.setId(UUID.randomUUID());
        r.setZonaId(yo.esAdmin() && req.zonaId() != null ? req.zonaId() : yo.zonaObligatoria());
        r.setCategoriaId(req.categoriaId());
        r.setDescripcion(req.descripcion().trim());
        if (req.unidad() != null && !req.unidad().isBlank()) {
            r.setUnidad(req.unidad().trim());
        }
        r.setCantidadTotal(req.cantidadTotal());
        r.setCantidadDisponible(req.cantidadTotal());
        r.setAlmacenTexto(req.almacenTexto().trim());
        recursos.save(r);
        return aResponse(r);
    }

    @Transactional(readOnly = true)
    public List<RecursoResponse> listar(UUID zonaId) {
        return recursos.findByZonaIdAndActivoTrueOrderByDescripcion(zonaId).stream().map(this::aResponse).toList();
    }

    /** Ajuste de inventario: el nuevo total no puede dejar negativa la cantidad disponible. */
    @Transactional
    public RecursoResponse ajustarTotal(UUID id, int nuevoTotal) {
        Recurso r = recursos.findById(id).orElseThrow(() -> ApiException.noEncontrado("El recurso"));
        int comprometido = r.getCantidadTotal() - r.getCantidadDisponible();
        if (nuevoTotal < comprometido) {
            throw ApiException.reglaNegocio("STOCK_COMPROMETIDO",
                    "Hay " + comprometido + " unidades asignadas; el total no puede ser menor.");
        }
        r.setCantidadDisponible(nuevoTotal - comprometido);
        r.setCantidadTotal(nuevoTotal);
        return aResponse(r);
    }

    /** RF37 + RF38. Descuento atómico de stock; el UNIQUE parcial evita duplicar la asignación viva. */
    @Transactional
    public AsignacionResponse asignar(UsuarioAutenticado admin, UUID reporteId, AsignarRequest req) {
        if (req.id() != null) {
            var previa = asignaciones.findById(req.id());
            if (previa.isPresent()) {
                return aResponse(previa.get());
            }
        }
        ReporteHumanitario reporte = reporteService.cargarParaActualizar(reporteId);
        if (reporte.getEstado().esCierre()) {
            throw ApiException.reglaNegocio("REPORTE_CERRADO", "La emergencia ya está cerrada.");
        }
        if (recursos.descontar(req.recursoId(), req.cantidad()) == 0) {
            if (!recursos.existsById(req.recursoId())) {
                throw ApiException.noEncontrado("El recurso");
            }
            throw ApiException.conflicto("SIN_STOCK", "No hay stock suficiente para esa cantidad.");
        }
        AsignacionRecurso a = new AsignacionRecurso();
        a.setId(req.id() != null ? req.id() : UUID.randomUUID());
        a.setReporteId(reporteId);
        a.setRecursoId(req.recursoId());
        a.setCantidad(req.cantidad());
        a.setAsignadoPor(admin.id());
        asignaciones.saveAndFlush(a);
        historial.registrar(EntidadHistorial.ASIGNACION, a.getId(), null, a.getEstado(), admin.id(), null);

        reporteService.pasarAEnAtencionSiAbierta(reporte, admin.id());          // RF38
        notificaciones.notificar(reporte.getReportanteId(), TipoNotificacion.RECURSO_ASIGNADO,
                "Se asignó ayuda a tu reporte", "Los recursos están en camino.", "REPORTE", reporteId);
        return aResponse(a);
    }

    @Transactional
    public AsignacionResponse cambiarEstadoAsignacion(UsuarioAutenticado admin, UUID asignacionId, EstadoAsignacion nuevo) {
        AsignacionRecurso a = asignaciones.findById(asignacionId).orElseThrow(() -> ApiException.noEncontrado("La asignación"));
        if (a.getEstado() != EstadoAsignacion.RESERVADA || nuevo == EstadoAsignacion.RESERVADA) {
            throw ApiException.reglaNegocio("TRANSICION_INVALIDA", "Solo una asignación reservada puede entregarse o cancelarse.");
        }
        if (nuevo == EstadoAsignacion.CANCELADA) {
            recursos.devolver(a.getRecursoId(), a.getCantidad());
        }
        EstadoAsignacion anterior = a.getEstado();
        a.setEstado(nuevo);
        historial.registrar(EntidadHistorial.ASIGNACION, a.getId(), anterior, nuevo, admin.id(), null);
        return aResponse(a);
    }

    @Transactional(readOnly = true)
    public List<AsignacionResponse> asignacionesDe(UUID reporteId) {
        return asignaciones.findByReporteIdOrderByCreatedAt(reporteId).stream().map(this::aResponse).toList();
    }

    private RecursoResponse aResponse(Recurso r) {
        return new RecursoResponse(r.getId(), r.getZonaId(), r.getCategoriaId(), catalogo.nombre(r.getCategoriaId()),
                r.getDescripcion(), r.getUnidad(), r.getCantidadTotal(), r.getCantidadDisponible(), r.getAlmacenTexto(),
                r.getVersion());
    }

    private AsignacionResponse aResponse(AsignacionRecurso a) {
        return new AsignacionResponse(a.getId(), a.getReporteId(), a.getRecursoId(), a.getCantidad(), a.getEstado(),
                a.getCreatedAt());
    }
}
