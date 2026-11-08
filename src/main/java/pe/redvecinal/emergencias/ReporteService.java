package pe.redvecinal.emergencias;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.catalogo.AmbitoCategoria;
import pe.redvecinal.catalogo.CatalogoService;
import pe.redvecinal.catalogo.CategoriaCache.CategoriaInfo;
import pe.redvecinal.emergencias.EmergenciaDtos.CrearReporteRequest;
import pe.redvecinal.emergencias.EmergenciaDtos.DatosSensiblesResponse;
import pe.redvecinal.emergencias.EmergenciaDtos.ReportePublico;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.geo.GeoUtils;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;
import pe.redvecinal.usuarios.repository.UsuarioRepository;

/** Módulo 4 - Ayuda humanitaria y emergencias (RF31 a RF35, RF38 a RF40). */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteService {

    private static final String ENTIDAD = "REPORTE";

    private final ReporteRepository reportes;
    private final ReporteDatosSensiblesRepository sensibles;
    private final CatalogoService catalogo;
    private final PrioridadCalculator prioridad;
    private final HistorialService historial;
    private final NotificacionService notificaciones;
    private final UsuarioRepository usuarios;
    private final ApplicationEventPublisher eventos;
    private final AppProperties props;

    /**
     * RF31-RF34. Todo en una transacción (RNF-08): reporte + datos sensibles + bitácora + notificaciones.
     * Idempotente con el id del cliente: vital si el vecino reintenta sin señal (RNF-29).
     */
    @Transactional
    public ReportePublico crear(UsuarioAutenticado yo, CrearReporteRequest req) {
        if (req.id() != null) {
            var previo = reportes.findById(req.id());
            if (previo.isPresent()) {
                if (!previo.get().getReportanteId().equals(yo.id())) {
                    throw ApiException.conflicto("ID_EN_USO", "El identificador enviado ya está en uso.");
                }
                return aPublico(previo.get());
            }
        }
        CategoriaInfo categoria = catalogo.validar(req.categoriaId(), AmbitoCategoria.NECESIDAD);
        boolean vulnerables = req.datosSensibles() != null && req.datosSensibles().detalleVulnerabilidad() != null
                && !req.datosSensibles().detalleVulnerabilidad().isBlank();

        ReporteHumanitario r = new ReporteHumanitario();
        r.setId(req.id() != null ? req.id() : UUID.randomUUID());
        r.setTipo(req.tipo());
        r.setReportanteId(yo.id());
        r.setZonaId(yo.zonaObligatoria());
        r.setCategoriaId(categoria.id());
        r.setDescripcionNecesidad(req.descripcion().trim());
        r.setNumeroPersonas(req.numeroPersonas());
        r.setUbicacionAprox(GeoUtils.aproximado(req.lat(), req.lng(), props.seguridad().decimalesUbicacionAprox()));
        r.setEsAnonimo(req.anonimo());
        r.setPrioridad(prioridad.calcular(req.tipo(), categoria.codigo(), req.numeroPersonas(), vulnerables));  // RF34
        reportes.save(r);

        ReporteDatosSensibles s = new ReporteDatosSensibles();       // RF33: ubicación exacta obligatoria
        s.setReporte(r);
        s.setUbicacionExacta(GeoUtils.punto(req.lat(), req.lng()));
        if (req.datosSensibles() != null) {
            s.setDireccionTexto(req.datosSensibles().direccionTexto());
            s.setNombrePersona(req.datosSensibles().nombrePersona());
            s.setContacto(req.datosSensibles().contacto());
            s.setDetalleVulnerabilidad(req.datosSensibles().detalleVulnerabilidad());
        }
        sensibles.save(s);

        historial.registrar(EntidadHistorial.REPORTE, r.getId(), null, r.getEstado(), yo.id(), "Reporte creado");
        List<UUID> admins = usuarios.buscarAdminsDeZona(r.getZonaId());
        notificaciones.notificarVarios(admins, TipoNotificacion.NUEVA_ALERTA_EMERGENCIA,
                "Nueva " + (r.getTipo() == TipoReporte.ALERTA_EMERGENCIA ? "alerta" : "necesidad crítica")
                        + " (" + r.getPrioridad() + ")", categoria.nombre(), ENTIDAD, r.getId());

        ReportePublico dto = aPublico(r);
        eventos.publishEvent(new ReporteActualizadoEvent(r.getZonaId(), "CREADO", dto));
        return dto;
    }

    /** RF35: dashboard en tiempo real (carga inicial; luego llegan eventos por SSE). */
    @Transactional(readOnly = true)
    public List<ReportePublico> dashboard(UUID zonaId) {
        return reportes.activosDeZona(zonaId).stream().map(this::aPublico).toList();
    }

    @Transactional(readOnly = true)
    public ReportePublico detalle(UUID id) {
        return aPublico(cargar(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportePublico> misReportes(UUID yoId, Pageable pageable) {
        return PageResponse.de(reportes.findByReportanteIdOrderByCreatedAtDesc(yoId, pageable), this::aPublico);
    }

    /** RNF-20: datos identificables y ubicación exacta, solo ADMIN. Cada acceso queda en el log. */
    @Transactional(readOnly = true)
    public DatosSensiblesResponse datosSensibles(UsuarioAutenticado admin, UUID reporteId) {
        ReporteHumanitario r = cargar(reporteId);
        ReporteDatosSensibles s = sensibles.findById(reporteId).orElseThrow(() -> ApiException.noEncontrado("El detalle"));
        log.info("AUDITORIA acceso a datos sensibles reporte={} admin={}", reporteId, admin.id());
        return new DatosSensiblesResponse(reporteId, r.getReportanteId(), GeoUtils.lat(s.getUbicacionExacta()),
                GeoUtils.lng(s.getUbicacionExacta()), s.getDireccionTexto(), s.getNombrePersona(), s.getContacto(),
                s.getDetalleVulnerabilidad());
    }

    /** Admin: tomar la atención, reabrir o descartar (RF37/RF38). */
    @Transactional
    public ReportePublico cambiarEstado(UsuarioAutenticado admin, UUID id, EstadoReporte nuevo, String motivo) {
        ReporteHumanitario r = cargar(id);
        if (nuevo == EstadoReporte.EN_ATENCION && r.getResponsableId() == null) {
            r.setResponsableId(admin.id());
        }
        transicionar(r, nuevo, admin.id(), motivo);
        return aPublico(r);
    }

    /** RF39: cierre formal como 'Atendida' por el administrador o el propio reportante. */
    @Transactional
    public ReportePublico atender(UsuarioAutenticado yo, UUID id, String motivo) {
        ReporteHumanitario r = cargar(id);
        if (!yo.esAdmin() && !r.getReportanteId().equals(yo.id())) {
            throw ApiException.prohibido("Solo el administrador o quien reportó puede cerrar la necesidad.");
        }
        transicionar(r, EstadoReporte.ATENDIDA, yo.id(), motivo);
        return aPublico(r);
    }

    /** RF38: cambio automático (usado al asignar el primer recurso). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void pasarAEnAtencionSiAbierta(ReporteHumanitario r, UUID actorId) {
        if (r.getEstado() == EstadoReporte.ABIERTA) {
            if (r.getResponsableId() == null) {
                r.setResponsableId(actorId);
            }
            transicionar(r, EstadoReporte.EN_ATENCION, actorId, "Automático: se asignaron recursos");
        }
    }

    /** RF40: traza inalterable de una alerta. */
    @Transactional(readOnly = true)
    public List<HistorialService.Item> historial(UUID id) {
        cargar(id);
        return historial.listar(EntidadHistorial.REPORTE, id);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportePublico> cerrados(UUID zonaId, Pageable pageable) {
        return PageResponse.de(reportes.cerrados(zonaId, pageable), this::aPublico);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public ReporteHumanitario cargarParaActualizar(UUID id) {
        return cargar(id);
    }

    private void transicionar(ReporteHumanitario r, EstadoReporte nuevo, UUID actorId, String motivo) {
        if (r.getEstado() == nuevo) {
            return;
        }
        if (!r.getEstado().siguientesPermitidos().contains(nuevo)) {
            throw ApiException.reglaNegocio("TRANSICION_INVALIDA",
                    "No se puede pasar de " + r.getEstado() + " a " + nuevo + ".");
        }
        EstadoReporte anterior = r.transicionar(nuevo, actorId, motivo);
        historial.registrar(EntidadHistorial.REPORTE, r.getId(), anterior, nuevo, actorId, motivo);   // RNF-27
        if (!r.getReportanteId().equals(actorId)) {
            notificaciones.notificar(r.getReportanteId(), TipoNotificacion.CAMBIO_ESTADO_REPORTE,
                    "Tu reporte cambió de estado", "Ahora está: " + nuevo, ENTIDAD, r.getId());
        }
        eventos.publishEvent(new ReporteActualizadoEvent(r.getZonaId(), "ESTADO", aPublico(r)));
    }

    private ReporteHumanitario cargar(UUID id) {
        return reportes.findById(id).orElseThrow(() -> ApiException.noEncontrado("El reporte"));
    }

    ReportePublico aPublico(ReporteHumanitario r) {
        return new ReportePublico(r.getId(), r.getTipo(), r.getCategoriaId(), catalogo.nombre(r.getCategoriaId()),
                r.getDescripcionNecesidad(), r.getNumeroPersonas(), GeoUtils.lat(r.getUbicacionAprox()),
                GeoUtils.lng(r.getUbicacionAprox()), r.getPrioridad(), r.getEstado(), r.getResponsableId(),
                r.getCreatedAt(), r.getCerradoEn(), r.getMotivoCierre(), r.getVersion());
    }
}
