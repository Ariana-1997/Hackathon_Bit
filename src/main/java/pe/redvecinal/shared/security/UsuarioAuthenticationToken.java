package pe.redvecinal.shared.security;

import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

public class UsuarioAuthenticationToken extends AbstractAuthenticationToken {

    private final UsuarioAutenticado usuario;
    private final Jwt jwt;

    public UsuarioAuthenticationToken(UsuarioAutenticado usuario, Jwt jwt, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.usuario = usuario;
        this.jwt = jwt;
        setAuthenticated(true);
    }

    @Override public Object getCredentials() { return jwt; }

    @Override public UsuarioAutenticado getPrincipal() { return usuario; }

    @Override public String getName() { return usuario.id().toString(); }

    public Jwt getToken() { return jwt; }
}
