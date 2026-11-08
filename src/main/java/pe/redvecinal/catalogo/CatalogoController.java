package pe.redvecinal.catalogo;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.redvecinal.catalogo.CatalogoService.CategoriaNodo;
import pe.redvecinal.shared.config.CacheConfig;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.shared.security.UsuarioAutenticado;

@Tag(name = "0. Catálogos y directorio")
@RestController
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;
    private final ContactoSoporteRepository contactos;

    public record ContactoResponse(UUID id, String nombre, String descripcion, String telefono, String enlace) {}

    public record ContactoRequest(
            UUID zonaId,
            @NotBlank(message = "Ingresa el nombre") @Size(max = 120) String nombre,
            @Size(max = 255) String descripcion,
            @Pattern(regexp = "^\\+?[0-9]{3,15}$", message = "Teléfono inválido") String telefono,
            @Size(max = 255) String enlace,
            short orden) {}

    @Operation(summary = "RF12 Categorías jerárquicas por ámbito (ECONOMIA, SOLIDARIDAD, NECESIDAD, RECURSO)")
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

    @Operation(summary = "Admin: registrar contacto de soporte")
    @PostMapping("/api/v1/admin/contactos-soporte")
    @ResponseStatus(HttpStatus.CREATED)
    @CacheEvict(cacheNames = CacheConfig.CONTACTOS, allEntries = true)
    @Transactional
    public ContactoResponse crearContacto(@Valid @RequestBody ContactoRequest req) {
        if (req.telefono() == null && req.enlace() == null) {
            throw ApiException.reglaNegocio("CONTACTO_SIN_MEDIO", "Indica al menos un teléfono o un enlace.");
        }
        ContactoSoporte c = new ContactoSoporte();
        c.setZonaId(req.zonaId());
        c.setNombre(req.nombre());
        c.setDescripcion(req.descripcion());
        c.setTelefono(req.telefono());
        c.setEnlace(req.enlace());
        c.setOrden(req.orden());
        c = contactos.save(c);
        return new ContactoResponse(c.getId(), c.getNombre(), c.getDescripcion(), c.getTelefono(), c.getEnlace());
    }

    @Operation(summary = "Admin: desactivar contacto de soporte")
    @DeleteMapping("/api/v1/admin/contactos-soporte/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @CacheEvict(cacheNames = CacheConfig.CONTACTOS, allEntries = true)
    @Transactional
    public void desactivarContacto(@PathVariable UUID id) {
        contactos.findById(id).orElseThrow(() -> ApiException.noEncontrado("El contacto")).setActivo(false);
    }
}
