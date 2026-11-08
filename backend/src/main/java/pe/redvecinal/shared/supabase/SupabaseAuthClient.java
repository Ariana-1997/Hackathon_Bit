package pe.redvecinal.shared.supabase;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import pe.redvecinal.shared.config.AppProperties;
import pe.redvecinal.shared.exception.ApiException;

/**
 * Cliente REST de Supabase Auth (GoTrue). El backend actúa de intermediario para poder aplicar
 * el bloqueo por intentos (RF06) y no exponer la service-role key.
 */
@Slf4j
@Component
public class SupabaseAuthClient {

    private final RestClient publico;   // apikey = anon
    private final RestClient admin;     // apikey = service role
    private final ObjectMapper mapper;

    public SupabaseAuthClient(RestClient.Builder builder, AppProperties props, ObjectMapper mapper) {
        AppProperties.Supabase sb = props.supabase();
        this.mapper = mapper;
        this.publico = builder.clone().baseUrl(sb.authUrl())
                .defaultHeader("apikey", sb.anonKey()).build();
        this.admin = builder.clone().baseUrl(sb.authUrl())
                .defaultHeader("apikey", sb.serviceRoleKey())
                .defaultHeader("Authorization", "Bearer " + sb.serviceRoleKey()).build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Sesion(@JsonProperty("access_token") String accessToken,
                         @JsonProperty("refresh_token") String refreshToken,
                         @JsonProperty("expires_in") long expiresIn,
                         @JsonProperty("token_type") String tokenType) {}

    /** RF01: grant_type=password. 400 = credenciales inválidas. */
    public Sesion loginConPassword(String email, String password) {
        return publico.post().uri("/token?grant_type=password")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", email, "password", password))
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(), (req, res) -> { throw traducirLogin(res); })
                .body(Sesion.class);
    }

    public Sesion refrescar(String refreshToken) {
        return publico.post().uri("/token?grant_type=refresh_token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("refresh_token", refreshToken))
                .retrieve()
                .onStatus(s -> s.is4xxClientError(), (req, res) -> {
                    throw ApiException.noAutorizado("SESION_EXPIRADA", "Tu sesión expiró. Inicia sesión nuevamente.");
                })
                .body(Sesion.class);
    }

    /** Registro. Devuelve el id de auth.users (la respuesta varía si la confirmación por correo está activa). */
    public UUID registrar(String email, String password) {
        JsonNode body = publico.post().uri("/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", email, "password", password))
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(), (req, res) -> { throw traducir(res); })
                .body(JsonNode.class);
        JsonNode user = body != null && body.has("user") ? body.get("user") : body;
        if (user == null || !user.hasNonNull("id")) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AUTH_RESPUESTA", "No se pudo completar el registro.");
        }
        return UUID.fromString(user.get("id").asText());
    }

    /** RF04: envía el enlace temporal de recuperación al correo. */
    public void enviarRecuperacion(String email, String redirectTo) {
        publico.post().uri(uri -> uri.path("/recover").queryParam("redirect_to", redirectTo).build())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", email))
                .retrieve()
                .onStatus(s -> s.is5xxServerError(), (req, res) -> { throw traducir(res); })
                .toBodilessEntity();
    }

    /** RF03: revoca el refresh token de la sesión actual. */
    public void cerrarSesion(String accessToken) {
        publico.post().uri("/logout?scope=local")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .onStatus(s -> true, (req, res) -> log.debug("logout Supabase respondió {}", res.getStatusCode()))
                .toBodilessEntity();
    }

    /** Compensación si falla la creación del perfil tras el alta en Auth. */
    public void eliminarUsuario(UUID authUserId) {
        try {
            admin.delete().uri("/admin/users/{id}", authUserId).retrieve().toBodilessEntity();
        } catch (Exception e) {
            log.error("No se pudo eliminar el usuario huérfano {} de Supabase Auth", authUserId, e);
        }
    }

    /** 400 invalid_credentials / invalid_grant = contraseña errada (cuenta para RF06). Otros 400: p. ej. correo sin confirmar. */
    private ApiException traducirLogin(ClientHttpResponse res) throws IOException {
        if (res.getStatusCode().value() == 400) {
            JsonNode err = leer(res);
            String codigo = err.path("error_code").asText(err.path("error").asText(""));
            if ("invalid_credentials".equals(codigo) || "invalid_grant".equals(codigo)) {
                return ApiException.noAutorizado("CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos.");
            }
            if ("email_not_confirmed".equals(codigo)) {
                return ApiException.noAutorizado("CORREO_NO_CONFIRMADO", "Confirma tu correo antes de iniciar sesión.");
            }
            return ApiException.reglaNegocio(codigo.isEmpty() ? "AUTH_ERROR" : codigo.toUpperCase(),
                    err.path("msg").asText(err.path("error_description").asText("No se pudo iniciar sesión.")));
        }
        return traducir(res);
    }

    private JsonNode leer(ClientHttpResponse res) {
        try {
            return mapper.readTree(res.getBody());
        } catch (Exception e) {
            return mapper.createObjectNode();
        }
    }

    private ApiException traducir(ClientHttpResponse res) throws IOException {
        int status = res.getStatusCode().value();
        String mensaje = "No se pudo completar la operación de autenticación.";
        String codigo = "AUTH_ERROR";
        try {
            JsonNode err = mapper.readTree(res.getBody());
            codigo = err.path("error_code").asText(codigo).toUpperCase();
            mensaje = err.path("msg").asText(err.path("error_description").asText(err.path("message").asText(mensaje)));
        } catch (Exception ignored) {
            // cuerpo no JSON
        }
        if (status == 429) {
            return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "DEMASIADOS_INTENTOS", "Demasiados intentos. Espera unos minutos.");
        }
        if (status == 422 || status == 400) {
            return ApiException.reglaNegocio(codigo, mensaje);
        }
        log.warn("Supabase Auth respondió {}: {}", status, mensaje);
        return new ApiException(HttpStatus.BAD_GATEWAY, "AUTH_NO_DISPONIBLE", "El servicio de autenticación no está disponible.");
    }
}
