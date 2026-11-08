package pe.redvecinal.catalogo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.catalogo.CatalogoService.CategoriaNodo;
import pe.redvecinal.shared.config.CacheConfig;
import pe.redvecinal.shared.security.UsuarioAutenticado;

@Tag(name = "0. Catálogos y directorio")
@RestController
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;
    private final ContactoSoporteRepository contactos;

    public record ContactoResponse(UUID id, String nombre, String descripcion, String telefono, String enlace) {}

    @Operation(summary = "RF12 Categorías jerárquicas por ámbito (ECONOMIA, SOLIDARIDAD, NECESIDAD)")
    @GetMapping("/api/v1/categorias")
    public List<CategoriaNodo> categorias(@RequestParam AmbitoCategoria ambito) {
        return catalogoService.arbol(ambito);
    }

    @Operation(summary = "RF50 Directorio de soporte de mi zona (más los contactos generales)")
    @GetMapping("/api/v1/contactos-soporte")
    @Cacheable(cacheNames = CacheConfig.CONTACTOS, key = "#yo.zonaId() ?: 'GLOBAL'")
    @Transactional(readOnly = true)
    public List<ContactoResponse> contactos(@AuthenticationPrincipal UsuarioAutenticado yo) {
        return contactos.visiblesPara(yo.zonaId()).stream()
                .map(c -> new ContactoResponse(c.getId(), c.getNombre(), c.getDescripcion(), c.getTelefono(), c.getEnlace()))
                .toList();
    }

}
