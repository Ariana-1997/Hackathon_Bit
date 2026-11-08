package pe.redvecinal.shared.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propiedades propias de la aplicación (prefijo "app" en application.yml). */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Supabase supabase, Cors cors, Seguridad seguridad, Emergencias emergencias) {

    public record Supabase(String url, String anonKey, String serviceRoleKey, String jwtSecret,
                           String storageBucket, String redirectRecuperacion) {
        public String authUrl()    { return url + "/auth/v1"; }
        public String storageUrl() { return url + "/storage/v1"; }
    }

    public record Cors(List<String> allowedOrigins) {}

    public record Seguridad(int maxIntentosLogin, int minutosBloqueo, int decimalesUbicacionAprox) {}

    public record Emergencias(long sseTimeoutMs, int radioMaximoKm) {}
}
