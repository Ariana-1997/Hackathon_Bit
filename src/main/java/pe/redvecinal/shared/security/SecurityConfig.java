package pe.redvecinal.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.DispatcherType;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import pe.redvecinal.shared.config.AppProperties;

/**
 * API sin estado protegida con los JWT de Supabase Auth (RNF-13, RNF-17).
 * Autorización por rol en URL (/admin/**) y por método con @PreAuthorize (RNF-14).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLICOS = {
            "/api/v1/auth/login", "/api/v1/auth/registro", "/api/v1/auth/refresh", "/api/v1/auth/recuperar",
            "/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
    };

     @Bean
    SecurityFilterChain api(HttpSecurity http, SupabaseJwtAuthenticationConverter converter,
                            @org.springframework.beans.factory.annotation.Qualifier("corsConfigurationSource") CorsConfigurationSource cors,
                            ObjectMapper objectMapper) throws Exception {
        AuthenticationEntryPoint entryPoint = (req, res, ex) -> {
            ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED,
                    "Tu sesión no es válida o expiró. Vuelve a iniciar sesión.");
            pd.setProperty("codigo", "NO_AUTENTICADO");
            res.setStatus(HttpStatus.UNAUTHORIZED.value());
            res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            objectMapper.writeValue(res.getOutputStream(), pd);
        };

        http.csrf(AbstractHttpConfigurer::disable)                      // API con Bearer token, sin cookies
            .cors(c -> c.configurationSource(cors))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                    .dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()  // SSE y errores
                    .requestMatchers(PUBLICOS).permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/zonas").permitAll()
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")   // RF08
                    .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o
                    .jwt(j -> j.jwtAuthenticationConverter(converter))
                    .authenticationEntryPoint(entryPoint))
            .headers(h -> h.httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000)));
        return http.build();
    }

    /**
     * Proyectos Supabase nuevos firman con "JWT Signing Keys" (asimétricas, JWKS).
     * Proyectos antiguos usan el secreto HS256 heredado: definir SUPABASE_JWT_SECRET.
     */
    @Bean
    JwtDecoder jwtDecoder(AppProperties props) {
        AppProperties.Supabase sb = props.supabase();
        NimbusJwtDecoder decoder;
        if (StringUtils.hasText(sb.jwtSecret())) {
            SecretKey key = new SecretKeySpec(sb.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        } else {
            decoder = NimbusJwtDecoder.withJwkSetUri(sb.authUrl() + "/.well-known/jwks.json")
                    .jwsAlgorithms(algs -> { algs.add(SignatureAlgorithm.ES256); algs.add(SignatureAlgorithm.RS256); })
                    .build();
        }
        OAuth2TokenValidator<Jwt> audiencia = new JwtClaimValidator<List<String>>(JwtClaimNames.AUD,
                aud -> aud != null && aud.contains("authenticated"));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(sb.authUrl()), audiencia));
        return decoder;
    }

    /** PRESTADOR incluye los permisos de VECINO (según def_rol). ADMIN también puede actuar como vecino. */
    @Bean
    static RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("""
                ROLE_ADMIN > ROLE_VECINO
                ROLE_PRESTADOR > ROLE_VECINO
                """);
    }

    @Bean
    @org.springframework.context.annotation.Primary
    CorsConfigurationSource corsConfigurationSource(AppProperties props) {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(props.cors().allowedOrigins());
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id", "Last-Event-ID"));
        cfg.setExposedHeaders(List.of("X-Request-Id"));
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
