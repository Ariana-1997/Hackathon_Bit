package pe.redvecinal.solidaridad;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.catalogo.AmbitoCategoria;
import pe.redvecinal.catalogo.CatalogoService;
import pe.redvecinal.notificaciones.NotificacionService;
import pe.redvecinal.notificaciones.TipoNotificacion;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.ModuloPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionRepository;
import pe.redvecinal.publicaciones.PublicacionService;
import pe.redvecinal.publicaciones.TipoPublicacion;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.geo.GeoUtils;
import pe.redvecinal.shared.historial.EntidadHistorial;
import pe.redvecinal.shared.historial.HistorialService;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.supabase.SupabaseStorageClient;
import pe.redvecinal.shared.web.PageResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.CrearRequest;
import pe.redvecinal.solidaridad.SolidaridadDtos.Detalle;
import pe.redvecinal.solidaridad.SolidaridadDtos.FeedItem;
import pe.redvecinal.solidaridad.SolidaridadDtos.InteraccionRequest;
import pe.redvecinal.solidaridad.SolidaridadDtos.InteraccionResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.MiInteraccionResponse;
import pe.redvecinal.solidaridad.SolidaridadDtos.MiPublicacion;
import pe.redvecinal.solidaridad.SolidaridadQueryRepository.FeedView;
import pe.redvecinal.usuarios.domain.Usuario;
import pe.redvecinal.usuarios.repository.UsuarioRepository;

/** Módulo 3 - Cadena de favores y solidaridad (RF21 a RF30). */
@Service
@RequiredArgsConstructor
public class SolidaridadService {

    private static final String ENTIDAD = "PUBLICACION";

    private final PublicacionRepository publicaciones;
    private final PublicacionService publicacionService;
    private final DetSolidaridadRepository detalles;
    private final InteraccionRepository interacciones;
    private final SolidaridadQueryRepository consultas;
    private final ReglasSolidaridad reglas;
    private final CatalogoService catalogo;
    private final UsuarioRepository usuarios;
    private final HistorialService historial;
    private final NotificacionService notificaciones;
    private final SupabaseStorageClient storage;
    private final AppProperties props;

    /** RF21, RF23-RF27. Una transacción; idempotente con el id del cliente (RNF-08, RNF-29). */
    @Transactional
    public Detalle crear(UsuarioAutenticado yo, CrearRequest req) {
        if (req.id() != null) {
            var existente = publicaciones.findById(req.id());
            if (existente.isPresent()) {
                if (!existente.get().getAutorId().equals(yo.id())) {
                    throw ApiException.conflicto("ID_EN_USO", "El identificador enviado ya está en uso.");
                }
                return detalle(req.id(), yo.id());
            }
        }
        reglas.validar(req, yo.id());
        Integer categoriaId = req.categoriaId() != null
                ? catalogo.validar(req.categoriaId(), AmbitoCategoria.SOLIDARIDAD).id()
                : catalogo.porCodigo(AmbitoCategoria.SOLIDARIDAD, reglas.codigoCategoriaPorDefecto(req.tipo())).id();

        Usuario autor = usuarios.findByIdAndDeletedAtIsNull(yo.id()).orElseThrow(() -> ApiException.noEncontrado("El usuario"));
        var ubicacion = req.lat() != null && req.lng() != null
                ? GeoUtils.aproximado(req.lat(), req.lng(), props.seguridad().decimalesUbicacionAprox())
                : autor.getUbicacion();     // por defecto, la ubicación aproximada del perfil

        Publicacion p = Publicacion.nueva(req.id(), yo.id(), yo.zonaObligatoria(), req.tipo(), categoriaId,
                req.titulo(), req.descripcion(), ubicacion);
        p.setExpiraEn(req.expiraEn());
        publicaciones.save(p);

        DetSolidaridad d = new DetSolidaridad();
        d.setPublicacion(p);
        d.setJustificacion(req.justificacion());
        d.setCantidad(req.cantidad());
        d.setMarca(req.marca());
        d.setCondicionesUso(req.condicionesUso());
        d.setFotosRutas(req.fotosRutas() == null ? new java.util.ArrayList<>() : new java.util.ArrayList<>(req.fotosRutas()));
        d.setOrigenTexto(req.origenTexto());
        d.setDestinoTexto(req.destinoTexto());
        d.setFechaSalida(req.fechaSalida());
        d.setAsientos(req.asientos());
        d.setFechaNecesaria(req.fechaNecesaria());
        d.setFechaDevolucionPrevista(req.fechaDevolucionPrevista());
        detalles.save(d);
        publicacionService.registrarCreacion(p);
        return aDetalle(d, p, autor.getNombre());
    }

    @Transactional(readOnly = true)
    public Detalle detalle(UUID id, UUID lectorId) {
        DetSolidaridad d = detalles.buscarDetalle(id).orElseThrow(() -> ApiException.noEncontrado("La publicación"));
        Publicacion p = d.getPublicacion();
        publicacionService.exigirVisible(p, lectorId);
        return aDetalle(d, p, usuarios.buscarNombre(p.getAutorId()).orElse(null));
    }

    @Transactional(readOnly = true)
    public PageResponse<FeedItem> feed(UUID zonaId, TipoPublicacion tipo, Pageable pageable) {
        return PageResponse.de(consultas.feed(zonaId, tipo == null ? null : tipo.name(), pageable), this::aFeed);
    }

    @Transactional(readOnly = true)
    public List<FeedItem> cercanos(double lat, double lng, double radioKm, TipoPublicacion tipo) {
        double radio = Math.min(Math.max(radioKm, 0.1), props.emergencias().radioMaximoKm());
        return consultas.cercanos(lat, lng, radio * 1000, tipo == null ? null : tipo.name()).stream().map(this::aFeed).toList();
    }

    /** RF28: mis publicaciones solidarias por fecha. */
    @Transactional(readOnly = true)
    public PageResponse<MiPublicacion> misPublicaciones(UUID yoId, Pageable pageable) {
        return PageResponse.de(publicaciones.findByAutorIdAndModuloAndDeletedAtIsNullOrderByCreatedAtDesc(
                        yoId, ModuloPublicacion.SOLIDARIDAD, pageable),
                p -> new MiPublicacion(p.getId(), p.getTipo(), p.getTitulo(), p.getEstado(), p.getCreatedAt()));
    }

    /** RF28: ayudas que ofrecí. */
    @Transactional(readOnly = true)
    public PageResponse<MiInteraccionResponse> misInteracciones(UUID yoId, Pageable pageable) {
        return PageResponse.de(interacciones.listarMias(yoId, pageable));
    }

    /** RF22 / RF30: postular o confirmar soporte con un toque. Idempotente con id del cliente. */
    @Transactional
    public InteraccionResponse postular(UsuarioAutenticado yo, UUID publicacionId, InteraccionRequest req) {
        if (req != null && req.id() != null) {
            var previa = interacciones.findById(req.id());
            if (previa.isPresent() && previa.get().getUsuarioId().equals(yo.id())) {
                InteraccionPublicacion i = previa.get();
                return new InteraccionResponse(i.getId(), i.getUsuarioId(), null, i.getEstado(), i.getMensaje(), i.getCreatedAt());
            }
        }
        Publicacion p = publicacionService.cargar(publicacionId, ModuloPublicacion.SOLIDARIDAD);
        if (p.getEstado() != EstadoPublicacion.ACTIVA) {
            throw ApiException.reglaNegocio("PUBLICACION_NO_DISPONIBLE", "Esta publicación ya no recibe respuestas.");
        }
        if (p.getAutorId().equals(yo.id())) {
            throw ApiException.reglaNegocio("AUTOPOSTULACION", "No puedes responder a tu propia publicación.");
        }
        InteraccionPublicacion i = new InteraccionPublicacion();
        i.setId(req != null && req.id() != null ? req.id() : UUID.randomUUID());
        i.setPublicacionId(publicacionId);
        i.setUsuarioId(yo.id());
        i.setMensaje(req == null ? null : req.mensaje());
        interacciones.saveAndFlush(i);   // índice único parcial: una interacción viva por vecino -> 409
        historial.registrar(EntidadHistorial.INTERACCION, i.getId(), null, i.getEstado(), yo.id(), null);

        notificaciones.notificar(p.getAutorId(), TipoNotificacion.RESPUESTA_A_PUBLICACION,
                "Un vecino quiere ayudarte", "Respondieron a \"" + p.getTitulo() + "\"", ENTIDAD, p.getId());
        return new InteraccionResponse(i.getId(), i.getUsuarioId(), null, i.getEstado(), i.getMensaje(), i.getCreatedAt());
    }

    /** El autor ve quién respondió. */
    @Transactional(readOnly = true)
    public List<InteraccionResponse> interaccionesDe(UsuarioAutenticado yo, UUID publicacionId) {
        Publicacion p = publicaciones.findByIdAndDeletedAtIsNull(publicacionId)
                .orElseThrow(() -> ApiException.noEncontrado("La publicación"));
        yo.exigirDuenio(p.getAutorId());
        return interacciones.listarDePublicacion(publicacionId);
    }

    /** El autor acepta UNA respuesta. Control de concurrencia con UPDATE condicional. */
    @Transactional
    public void aceptar(UsuarioAutenticado yo, UUID publicacionId, UUID interaccionId) {
        Publicacion p = publicacionService.cargar(publicacionId, ModuloPublicacion.SOLIDARIDAD);
        yo.exigirDuenio(p.getAutorId());
        InteraccionPublicacion i = cargarInteraccion(publicacionId, interaccionId);
        if (i.getEstado() != EstadoInteraccion.PENDIENTE) {
            throw ApiException.reglaNegocio("INTERACCION_NO_PENDIENTE", "Esta respuesta ya fue procesada.");
        }
        if (detalles.asignarGanadora(publicacionId, interaccionId) == 0) {
            throw ApiException.conflicto("YA_ACEPTADA", "Ya aceptaste otra respuesta para esta publicación.");
        }
        cambiarEstado(i, EstadoInteraccion.ACEPTADA, yo.id());
        publicacionService.cambiarEstado(p, EstadoPublicacion.EN_CURSO, yo.id(), "Respuesta aceptada");
        notificaciones.notificar(i.getUsuarioId(), TipoNotificacion.INTERACCION_ACEPTADA,
                "Tu ayuda fue aceptada", "Coordina con tu vecino: \"" + p.getTitulo() + "\"", ENTIDAD, p.getId());
    }

    @Transactional
    public void rechazar(UsuarioAutenticado yo, UUID publicacionId, UUID interaccionId) {
        Publicacion p = publicacionService.cargar(publicacionId, ModuloPublicacion.SOLIDARIDAD);
        yo.exigirDuenio(p.getAutorId());
        InteraccionPublicacion i = cargarInteraccion(publicacionId, interaccionId);
        if (i.getEstado() != EstadoInteraccion.PENDIENTE) {
            throw ApiException.reglaNegocio("INTERACCION_NO_PENDIENTE", "Esta respuesta ya fue procesada.");
        }
        cambiarEstado(i, EstadoInteraccion.RECHAZADA, yo.id());
        notificaciones.notificar(i.getUsuarioId(), TipoNotificacion.INTERACCION_RECHAZADA,
                "Gracias por ofrecer tu ayuda", "En esta ocasión no fue necesaria: \"" + p.getTitulo() + "\"", ENTIDAD, p.getId());
    }

    /** El vecino que postuló se retira. */
    @Transactional
    public void retirar(UsuarioAutenticado yo, UUID publicacionId, UUID interaccionId) {
        InteraccionPublicacion i = cargarInteraccion(publicacionId, interaccionId);
        yo.exigirDuenio(i.getUsuarioId());
        if (i.getEstado() != EstadoInteraccion.PENDIENTE) {
            throw ApiException.reglaNegocio("INTERACCION_NO_PENDIENTE", "Solo puedes retirarte mientras esté pendiente.");
        }
        cambiarEstado(i, EstadoInteraccion.RETIRADA, yo.id());
    }

    /** El autor cierra la publicación como completada (cierra también la interacción aceptada). */
    @Transactional
    public void completar(UsuarioAutenticado yo, UUID publicacionId) {
        Publicacion p = publicacionService.cargar(publicacionId, ModuloPublicacion.SOLIDARIDAD);
        yo.exigirDuenio(p.getAutorId());
        if (!p.getEstado().esVisible()) {
            throw ApiException.reglaNegocio("ESTADO_INVALIDO", "La publicación ya está cerrada.");
        }
        interacciones.findByPublicacionIdAndEstado(publicacionId, EstadoInteraccion.ACEPTADA)
                .forEach(i -> cambiarEstado(i, EstadoInteraccion.COMPLETADA, yo.id()));
        publicacionService.cambiarEstado(p, EstadoPublicacion.COMPLETADA, yo.id(), null);
    }

    @Transactional
    public void cancelar(UsuarioAutenticado yo, UUID publicacionId) {
        Publicacion p = publicacionService.cargar(publicacionId, ModuloPublicacion.SOLIDARIDAD);
        yo.exigirDuenio(p.getAutorId());
        publicacionService.cambiarEstado(p, EstadoPublicacion.CANCELADA, yo.id(), null);
    }

    @Transactional
    public void eliminar(UsuarioAutenticado yo, UUID publicacionId) {
        Publicacion p = publicacionService.cargar(publicacionId, ModuloPublicacion.SOLIDARIDAD);
        yo.exigirDuenio(p.getAutorId());
        publicacionService.darDeBaja(p, yo.id(), null);
    }

    private InteraccionPublicacion cargarInteraccion(UUID publicacionId, UUID interaccionId) {
        return interacciones.findByIdAndPublicacionId(interaccionId, publicacionId)
                .orElseThrow(() -> ApiException.noEncontrado("La respuesta"));
    }

    private void cambiarEstado(InteraccionPublicacion i, EstadoInteraccion nuevo, UUID actor) {
        EstadoInteraccion anterior = i.getEstado();
        i.setEstado(nuevo);
        historial.registrar(EntidadHistorial.INTERACCION, i.getId(), anterior, nuevo, actor, null);
    }

    private FeedItem aFeed(FeedView v) {
        return new FeedItem(v.getId(), TipoPublicacion.valueOf(v.getTipo()), v.getTitulo(), v.getResumen(),
                v.getCategoriaNombre(), EstadoPublicacion.valueOf(v.getEstado()), v.getAutorNombre(), v.getLat(),
                v.getLng(), v.getDistanciaM(), v.getCreadoEpochMs() == null ? null : Instant.ofEpochMilli(v.getCreadoEpochMs()));
    }

    private Detalle aDetalle(DetSolidaridad d, Publicacion p, String autorNombre) {
        Map<String, String> fotos = d.getFotosRutas().isEmpty() ? Map.of() : storage.firmarDescargas(d.getFotosRutas(), 3600);
        return new Detalle(p.getId(), p.getTipo(), p.getCategoriaId(), catalogo.nombre(p.getCategoriaId()), p.getTitulo(),
                p.getDescripcion(), p.getAutorId(), autorNombre, p.getEstado(), GeoUtils.lat(p.getUbicacion()),
                GeoUtils.lng(p.getUbicacion()), p.getExpiraEn(), d.getJustificacion(), d.getCantidad(), d.getMarca(),
                d.getCondicionesUso(), fotos, d.getOrigenTexto(), d.getDestinoTexto(), d.getFechaSalida(), d.getAsientos(),
                d.getFechaNecesaria(), d.getFechaDevolucionPrevista(), d.getInteraccionAceptadaId(), p.getVersion(),
                p.getCreatedAt());
    }
}
