package pe.redvecinal.archivos;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.shared.security.UsuarioAutenticado;
import pe.redvecinal.shared.supabase.SupabaseStorageClient;

/**
 * RF24: subida de fotos. Flujo: 1) el cliente pide una URL firmada; 2) hace PUT del archivo directo a Storage;
 * 3) envía la "ruta" en fotosRutas al crear la publicación. Las rutas siempre empiezan con el id del usuario.
 */
@Tag(name = "3. Cadena de favores y solidaridad")
@RestController
@RequestMapping("/api/v1/archivos")
@RequiredArgsConstructor
public class ArchivoController {

    private final SupabaseStorageClient storage;

    public record SubidaRequest(
            @NotBlank @Pattern(regexp = "(?i)^(jpg|jpeg|png|webp)$", message = "Solo imágenes jpg, png o webp")
            String extension) {}

    public record SubidaResponse(String ruta, String urlSubida) {}

    @Operation(summary = "Obtener URL firmada para subir una foto (bucket privado)")
    @PostMapping("/subidas")
    public SubidaResponse firmar(@AuthenticationPrincipal UsuarioAutenticado yo, @Valid @RequestBody SubidaRequest req) {
        String ruta = yo.id() + "/" + UUID.randomUUID() + "." + req.extension().toLowerCase(Locale.ROOT);
        return new SubidaResponse(ruta, storage.firmarSubida(ruta));
    }
}
