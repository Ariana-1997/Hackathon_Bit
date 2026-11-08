package pe.redvecinal.usuarios.auth;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.supabase.SupabaseAuthClient;
import pe.redvecinal.usuarios.auth.AuthDtos.LoginRequest;
import pe.redvecinal.usuarios.auth.AuthDtos.RegistroRequest;
import pe.redvecinal.usuarios.auth.AuthDtos.SesionResponse;
import pe.redvecinal.usuarios.domain.EstadoUsuario;
import pe.redvecinal.usuarios.domain.RolUsuario;
import pe.redvecinal.usuarios.domain.Usuario;
import pe.redvecinal.usuarios.perfil.PerfilService;
import pe.redvecinal.usuarios.repository.UsuarioRepository;

/**
 * Módulo 1 - Acceso. RF01, RF03, RF04, RF06.
 * Sin @Transactional a nivel de método: el contador de intentos fallidos debe guardarse aunque el login falle.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final SupabaseAuthClient supabase;
    private final UsuarioRepository usuarios;
    private final PerfilService perfilService;
    private final AppProperties props;
    private final TransactionTemplate tx;

    public SesionResponse login(LoginRequest req) {
        AppProperties.Seguridad seg = props.seguridad();
        Optional<Usuario> usuario = usuarios.buscarPorEmail(req.email());

        usuario.filter(u -> u.estaBloqueado(OffsetDateTime.now())).ifPresent(u -> {
            long minutos = Math.max(1, Duration.between(OffsetDateTime.now(), u.getBloqueadoHasta()).toMinutes() + 1);
            throw new ApiException(HttpStatus.LOCKED, "CUENTA_BLOQUEADA",
                    "Cuenta bloqueada temporalmente por intentos fallidos. Intenta en " + minutos + " minuto(s).");
        });

        SupabaseAuthClient.Sesion sesion;
        try {
            sesion = supabase.loginConPassword(req.email(), req.password());
        } catch (ApiException e) {
            if ("CREDENCIALES_INVALIDAS".equals(e.getCodigo())) {
                usuario.ifPresent(u -> usuarios.registrarIntentoFallido(u.getId(), seg.maxIntentosLogin(), seg.minutosBloqueo()));
            }
            throw e;
        }

        Usuario u = usuario.orElseThrow(() -> ApiException.noAutorizado("SIN_PERFIL",
                "Tu cuenta no tiene un perfil en la comunidad. Regístrate desde la aplicación."));
        if (u.getEstado() == EstadoUsuario.SUSPENDIDO) {
            supabase.cerrarSesion(sesion.accessToken());
            throw ApiException.prohibido("Tu cuenta está suspendida. Comunícate con el administrador.");
        }
        if (u.getIntentosFallidos() > 0 || u.getBloqueadoHasta() != null) {
            usuarios.reiniciarIntentos(u.getId());
        }
        return new SesionResponse(sesion.accessToken(), sesion.refreshToken(), sesion.expiresIn(), sesion.tokenType(),
                perfilService.obtener(u.getId()));
    }

    /** Alta en Supabase Auth + perfil en mae_usuario. Si el perfil falla, se compensa borrando el usuario de Auth. */
    public UUID registrar(RegistroRequest req) {
        UUID authUserId = supabase.registrar(req.email(), req.password());
        RolUsuario rol = req.tipoCuenta() == AuthDtos.TipoCuenta.PRESTADOR ? RolUsuario.PRESTADOR : RolUsuario.VECINO;
        try {
            return tx.execute(status -> usuarios.save(
                    Usuario.nuevo(authUserId, req.nombre().trim(), req.telefono(), rol)).getId());
        } catch (RuntimeException e) {
            log.error("Fallo al crear el perfil; se revierte el alta en Supabase Auth", e);
            supabase.eliminarUsuario(authUserId);
            throw e;
        }
    }

    public SesionResponse refrescar(String refreshToken) {
        SupabaseAuthClient.Sesion s = supabase.refrescar(refreshToken);
        return new SesionResponse(s.accessToken(), s.refreshToken(), s.expiresIn(), s.tokenType(), null);
    }

    /** Siempre responde igual, exista o no el correo (no revela cuentas registradas). */
    public void recuperar(String email) {
        supabase.enviarRecuperacion(email, props.supabase().redirectRecuperacion());
    }

    public void cerrarSesion(String accessToken) {
        supabase.cerrarSesion(accessToken);
    }
}
