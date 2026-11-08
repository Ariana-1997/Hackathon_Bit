package pe.redvecinal.usuarios.perfil;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.geo.Coordenada;
import pe.redvecinal.shared.geo.GeoUtils;
import pe.redvecinal.shared.security.PerfilSeguridadService;
import pe.redvecinal.usuarios.domain.Usuario;
import pe.redvecinal.usuarios.domain.Zona;
import pe.redvecinal.usuarios.perfil.PerfilDtos.ActualizarPerfilRequest;
import pe.redvecinal.usuarios.perfil.PerfilDtos.PerfilResponse;
import pe.redvecinal.usuarios.perfil.PerfilDtos.ZonaResumen;
import pe.redvecinal.usuarios.repository.UsuarioRepository;
import pe.redvecinal.usuarios.repository.ZonaRepository;

/** Módulo 1 - Perfil y comunidad. RF02, RF07, RF09, RF10, RF49. */
@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UsuarioRepository usuarios;
    private final ZonaRepository zonas;
    private final PerfilSeguridadService perfilSeguridad;
    private final AppProperties props;

    @Transactional(readOnly = true)
    public PerfilResponse obtener(UUID usuarioId) {
        return aResponse(cargar(usuarioId));
    }

    @Transactional
    public PerfilResponse actualizar(UUID usuarioId, ActualizarPerfilRequest req) {
        Usuario u = cargar(usuarioId);
        u.setNombre(req.nombre().trim());
        u.setTelefono(req.telefono());
        return aResponse(u);
    }

    /**
     * RF09: guarda la ubicación APROXIMADA. RF10: asocia automáticamente la zona usando el punto exacto
     * (que no se almacena).
     */
    @Transactional
    public PerfilResponse actualizarUbicacion(UUID usuarioId, Coordenada c) {
        Usuario u = cargar(usuarioId);
        UUID zonaId = zonas.buscarZonaIdPorPunto(c.lat(), c.lng()).map(UUID::fromString)
                .orElseThrow(() -> ApiException.reglaNegocio("FUERA_DE_COBERTURA",
                        "Tu ubicación aún no pertenece a ninguna comunidad registrada."));
        u.setUbicacion(GeoUtils.aproximado(c.lat(), c.lng(), props.seguridad().decimalesUbicacionAprox()));
        boolean cambioZona = !zonaId.equals(u.getZonaId());
        u.setZonaId(zonaId);
        if (cambioZona) {
            perfilSeguridad.invalidar(u.getAuthUserId());
        }
        return aResponse(u);
    }

    /** RF49: el frontend muestra el tutorial mientras tutorialCompletado sea false. */
    @Transactional
    public void completarTutorial(UUID usuarioId) {
        cargar(usuarioId).setTutorialCompletado(true);
    }

    private Usuario cargar(UUID id) {
        return usuarios.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> ApiException.noEncontrado("El usuario"));
    }

    private PerfilResponse aResponse(Usuario u) {
        ZonaResumen zona = u.getZonaId() == null ? null
                : zonas.findById(u.getZonaId()).map(z -> new ZonaResumen(z.getId(), z.getCodigo(), z.getNombre())).orElse(null);
        return new PerfilResponse(u.getId(), u.getNombre(), u.getTelefono(), zona,
                GeoUtils.lat(u.getUbicacion()), GeoUtils.lng(u.getUbicacion()), u.isTutorialCompletado(),
                ModuloApp.todos(), u.getVersion());
    }

    @Transactional(readOnly = true)
    public java.util.List<PerfilDtos.ZonaResponse> zonasActivas() {
        return zonas.findByActivaTrueOrderByNombre().stream()
                .map((Zona z) -> new PerfilDtos.ZonaResponse(z.getId(), z.getCodigo(), z.getNombre(),
                        GeoUtils.lat(z.getCentro()), GeoUtils.lng(z.getCentro()), z.getRadioM()))
                .toList();
    }
}
