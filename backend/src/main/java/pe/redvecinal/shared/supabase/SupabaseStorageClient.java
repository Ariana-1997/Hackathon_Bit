package pe.redvecinal.shared.supabase;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import pe.redvecinal.shared.config.AppProperties;

/**
 * Supabase Storage con bucket PRIVADO (fotos de donaciones, RF24).
 * El frontend nunca recibe la service-role key: el backend firma URLs temporales de subida y de descarga.
 */
@Component
public class SupabaseStorageClient {

    private final RestClient client;
    private final String bucket;
    private final String storageUrl;

    public SupabaseStorageClient(RestClient.Builder builder, AppProperties props) {
        AppProperties.Supabase sb = props.supabase();
        this.bucket = sb.storageBucket();
        this.storageUrl = sb.storageUrl();
        this.client = builder.clone().baseUrl(storageUrl)
                .defaultHeader("apikey", sb.serviceRoleKey())
                .defaultHeader("Authorization", "Bearer " + sb.serviceRoleKey()).build();
    }

    /** URL firmada para que el navegador suba el archivo directamente (PUT) a Storage. */
    public String firmarSubida(String ruta) {
        JsonNode r = client.post().uri("/object/upload/sign/" + bucket + "/" + ruta)
                .contentType(MediaType.APPLICATION_JSON).body(Map.of())
                .retrieve().body(JsonNode.class);
        return storageUrl + r.path("url").asText();
    }

    /** URLs firmadas de lectura, en un solo llamado (evita N peticiones). */
    public Map<String, String> firmarDescargas(List<String> rutas, int segundos) {
        Map<String, String> urls = new LinkedHashMap<>();
        if (rutas == null || rutas.isEmpty()) {
            return urls;
        }
        JsonNode r = client.post().uri("/object/sign/{bucket}", bucket)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("expiresIn", segundos, "paths", rutas))
                .retrieve().body(JsonNode.class);
        if (r != null) {
            r.forEach(item -> {
                if (item.hasNonNull("signedURL")) {
                    urls.put(item.path("path").asText(), storageUrl + item.path("signedURL").asText());
                }
            });
        }
        return urls;
    }
}
