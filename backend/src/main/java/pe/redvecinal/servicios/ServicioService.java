package pe.redvecinal.servicios;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.catalogo.AmbitoCategoria;
import pe.redvecinal.catalogo.CatalogoService;
import pe.redvecinal.publicaciones.EstadoPublicacion;
import pe.redvecinal.publicaciones.ModuloPublicacion;
import pe.redvecinal.publicaciones.Publicacion;
import pe.redvecinal.publicaciones.PublicacionRepository;
import pe.redvecinal.publicaciones.PublicacionService;
import pe.redvecinal.publicaciones.TipoPublicacion;
import pe.redvecinal.servicios.ServicioDtos.ServicioDetalle;
import pe.redvecinal.servicios.ServicioDtos.ServicioRequest;
import pe.redvecinal.servicios.ServicioDtos.ServicioResumen;
import pe.redvecinal.servicios.ServicioDtos.Sugerencia;
import pe.redvecinal.servicios.ServicioQueryRepository.ServicioResumenView;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.geo.GeoUtils;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.web.PageResponse;
import pe.redvecinal.usuarios.repository.UsuarioRepository;

/** Módulo 2 - Servicios de proximidad y economía local (RF11 a RF20). */
@Service
@RequiredArgsConstructor
public class ServicioService {

    private final PublicacionRepository publicaciones;
    private final PublicacionService publicacionService;
    private final DetServicioRepository detalles;
    private final ServicioQueryRepository consultas;
    private final CatalogoService catalogo;
    private final UsuarioRepository usuarios;
    private final AppProperties props;

    /** RF11. Transacción única: publicación + detalle + bitácora (RNF-08). Idempotente con id del cliente (RNF-29). */
    @Transactional
    public ServicioDetalle crear(UsuarioAutenticado yo, ServicioRequest req) {
        if (req.id() != null) {
            var existente = publicaciones.findById(req.id());
            if (existente.isPresent()) {
                if (!existente.get().getAutorId().equals(yo.id())) {
                    throw ApiException.conflicto("ID_EN_USO", "El identificador enviado ya está en uso.");
                }
                return detalle(req.id(), yo.id());
            }
        }
        catalogo.validar(req.categoriaId(), AmbitoCategoria.ECONOMIA);
        Publicacion p = Publicacion.nueva(req.id(), yo.id(), yo.zonaObligatoria(), TipoPublicacion.SERVICIO,
                req.categoriaId(), req.titulo(), req.descripcion(), GeoUtils.punto(req.lat(), req.lng()));
        publicaciones.save(p);

        DetServicio d = new DetServicio();
        d.setPublicacion(p);
        aplicar(d, req);
        detalles.save(d);
        publicacionService.registrarCreacion(p);
        return aDetalle(d, p);
    }

    /** RF13: edición en caliente de campos y tarifas. Solo el autor (RNF-15). */
    @Transactional
    public ServicioDetalle actualizar(UsuarioAutenticado yo, UUID id, ServicioRequest req) {
        DetServicio d = detalles.buscarDetalle(id).orElseThrow(() -> ApiException.noEncontrado("El servicio"));
        Publicacion p = d.getPublicacion();
        yo.exigirDuenio(p.getAutorId());
        if (req.version() != null && !Objects.equals(req.version(), p.getVersion())) {
            throw ApiException.conflicto("MODIFICADO_POR_OTRO", "El servicio cambió desde que lo abriste. Recarga e intenta de nuevo.");
        }
        catalogo.validar(req.categoriaId(), AmbitoCategoria.ECONOMIA);
        p.setCategoriaId(req.categoriaId());
        p.setTitulo(req.titulo().trim());
        p.setDescripcion(req.descripcion());
        p.setUbicacion(GeoUtils.punto(req.lat(), req.lng()));
        aplicar(d, req);
        return aDetalle(d, p);
    }

    /** RF14: activar / desactivar sin borrar. Solo el autor. */
    @Transactional
    public void cambiarEstado(UsuarioAutenticado yo, UUID id, boolean activo) {
        Publicacion p = publicacionService.cargar(id, ModuloPublicacion.ECONOMIA);
        yo.exigirDuenio(p.getAutorId());
        publicacionService.cambiarEstado(p, activo ? EstadoPublicacion.ACTIVA : EstadoPublicacion.INACTIVA, yo.id(), null);
    }

    /** RF14: baja lógica (deleted_at). */
    @Transactional
    public void eliminar(UsuarioAutenticado yo, UUID id) {
        Publicacion p = publicacionService.cargar(id, ModuloPublicacion.ECONOMIA);
        yo.exigirDuenio(p.getAutorId());
        publicacionService.darDeBaja(p, yo.id(), null);
    }

    @Transactional(readOnly = true)
    public ServicioDetalle detalle(UUID id, UUID lectorId) {
        DetServicio d = detalles.buscarDetalle(id).orElseThrow(() -> ApiException.noEncontrado("El servicio"));
        publicacionService.exigirVisible(d.getPublicacion(), lectorId);
        return aDetalle(d, d.getPublicacion());
    }

    @Transactional(readOnly = true)
    public PageResponse<ServicioResumen> catalogo(UUID zonaId, Integer categoriaId, String marca, Pageable pageable) {
        String patronMarca = marca == null || marca.isBlank() ? null : "%" + escaparLike(marca.trim()) + "%";
        return PageResponse.de(consultas.catalogo(zonaId, categoriaId, patronMarca, pageable), this::aResumen);
    }

    @Transactional(readOnly = true)
    public List<Sugerencia> autocompletar(UUID zonaId, String texto) {
        String t = texto == null ? "" : texto.trim();
        if (t.length() < 2) {
            return List.of();
        }
        return consultas.autocompletar(zonaId, "%" + escaparLike(t) + "%", t).stream()
                .map(v -> new Sugerencia(v.getId(), v.getNombreComercial(), v.getTitulo())).toList();
    }

    @Transactional(readOnly = true)
    public List<ServicioResumen> cercanos(double lat, double lng, double radioKm, Integer categoriaId) {
        double radio = Math.min(Math.max(radioKm, 0.1), props.emergencias().radioMaximoKm());
        return consultas.cercanos(lat, lng, radio * 1000, categoriaId, 200).stream().map(this::aResumen).toList();
    }

    private void aplicar(DetServicio d, ServicioRequest req) {
        d.setNombreComercial(req.nombreComercial().trim());
        d.setMarca(req.marca());
        d.setTelefonoContacto(req.telefonoContacto());
        d.setDireccionTexto(req.direccionTexto());
        d.setHorario(req.horario());
        d.setPrecioDesde(req.precioDesde());
        d.setTarifaDetalle(req.tarifaDetalle());
    }

    private ServicioResumen aResumen(ServicioResumenView v) {
        return new ServicioResumen(v.getId(), v.getTitulo(), v.getNombreComercial(), v.getMarca(), v.getCategoriaId(),
                v.getCategoriaNombre(), v.getPrecioDesde(), v.getMoneda(), v.getPromedioValoracion(),
                v.getTotalValoraciones(), v.getLat(), v.getLng(), v.getDistanciaM(),
                ServicioDtos.badge(v.getPromedioValoracion(), v.getTotalValoraciones()));
    }

    private ServicioDetalle aDetalle(DetServicio d, Publicacion p) {
        return new ServicioDetalle(p.getId(), p.getAutorId(), usuarios.buscarNombre(p.getAutorId()).orElse(null),
                p.getCategoriaId(), catalogo.nombre(p.getCategoriaId()), p.getTitulo(), p.getDescripcion(),
                d.getNombreComercial(), d.getMarca(), d.getTelefonoContacto(), d.getDireccionTexto(), d.getHorario(),
                d.getPrecioDesde(), d.getTarifaDetalle(), d.getMoneda(), d.getPromedioValoracion(),
                d.getTotalValoraciones(), ServicioDtos.badge(d.getPromedioValoracion(), d.getTotalValoraciones()),
                GeoUtils.lat(p.getUbicacion()), GeoUtils.lng(p.getUbicacion()), p.getEstado(), p.getVersion(),
                p.getCreatedAt());
    }

    static String escaparLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
