package pe.redvecinal.shared.security;

import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import pe.redvecinal.shared.config.CacheConfig;
import pe.redvecinal.usuarios.repository.UsuarioRepository;

/** Carga (y cachea 5 min) rol, zona y estado del usuario del token: una consulta por usuario, no por petición (RNF-06). */
@Service
@RequiredArgsConstructor
public class PerfilSeguridadService {

    private final UsuarioRepository usuarioRepository;

    @Cacheable(cacheNames = CacheConfig.PERFIL_SEGURIDAD, key = "#authUserId")
    public Optional<UsuarioAutenticado> cargar(UUID authUserId) {
        return usuarioRepository.buscarPerfilSeguridad(authUserId);
    }

    /** Llamar cuando cambie rol, zona o estado (p. ej. suspensión). */
    @CacheEvict(cacheNames = CacheConfig.PERFIL_SEGURIDAD, key = "#authUserId")
    public void invalidar(UUID authUserId) {
        // solo invalida la caché
    }
}
