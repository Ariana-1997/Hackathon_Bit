package pe.redvecinal.shared.security;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Convierte el JWT de Supabase (sub = auth.users.id) en el usuario de negocio (RNF-14).
 * No hay roles: todo usuario con perfil activo tiene el mismo nivel de acceso.
 */
@Component
@RequiredArgsConstructor
public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final PerfilSeguridadService perfiles;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID authUserId = UUID.fromString(jwt.getSubject());
        UsuarioAutenticado usuario = perfiles.cargar(authUserId)
                .orElseThrow(() -> new BadCredentialsException("La cuenta no tiene perfil registrado"));
        if (!usuario.activo()) {
            throw new DisabledException("Cuenta suspendida");
        }
        return new UsuarioAuthenticationToken(usuario, jwt, List.of());
    }
}
