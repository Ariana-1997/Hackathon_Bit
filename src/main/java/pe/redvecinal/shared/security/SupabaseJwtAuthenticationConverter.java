package pe.redvecinal.shared.security;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Convierte el JWT de Supabase (sub = auth.users.id) en el usuario de negocio con su rol (RF02, RNF-14).
 * El rol NO se toma del token: se lee de mae_usuario, que es la fuente de verdad.
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
        return new UsuarioAuthenticationToken(usuario, jwt,
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.rol().name())));
    }
}
