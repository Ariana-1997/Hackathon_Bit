package pe.redvecinal.catalogo;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.redvecinal.catalogo.CategoriaCache.CategoriaInfo;
import pe.redvecinal.shared.exception.ApiException;

@Service
@RequiredArgsConstructor
public class CatalogoService {

    private final CategoriaCache cache;

    public record CategoriaNodo(Integer id, String codigo, String nombre, List<CategoriaNodo> hijos) {}

    /** RF12: árbol de categorías de un ámbito (raíces con sus subcategorías). */
    public List<CategoriaNodo> arbol(AmbitoCategoria ambito) {
        List<CategoriaInfo> delAmbito = cache.porId().values().stream()
                .filter(c -> c.ambito() == ambito)
                .sorted(Comparator.comparing(CategoriaInfo::nombre))
                .toList();
        Map<Integer, List<CategoriaInfo>> porPadre = delAmbito.stream().filter(c -> c.padreId() != null)
                .collect(Collectors.groupingBy(CategoriaInfo::padreId));
        List<CategoriaNodo> raices = new ArrayList<>();
        for (CategoriaInfo c : delAmbito) {
            if (c.padreId() == null) {
                raices.add(nodo(c, porPadre));
            }
        }
        return raices;
    }

    private CategoriaNodo nodo(CategoriaInfo c, Map<Integer, List<CategoriaInfo>> porPadre) {
        List<CategoriaNodo> hijos = porPadre.getOrDefault(c.id(), List.of()).stream().map(h -> nodo(h, porPadre)).toList();
        return new CategoriaNodo(c.id(), c.codigo(), c.nombre(), hijos);
    }

    /** El ámbito de la categoría debe corresponder al módulo (regla indicada en bd_v2: "lo valida el servicio"). */
    public CategoriaInfo validar(Integer categoriaId, AmbitoCategoria ambitoEsperado) {
        CategoriaInfo c = cache.porId().get(categoriaId);
        if (c == null || c.ambito() != ambitoEsperado) {
            throw ApiException.reglaNegocio("CATEGORIA_INVALIDA", "La categoría seleccionada no corresponde a esta sección.");
        }
        return c;
    }

    public CategoriaInfo porCodigo(AmbitoCategoria ambito, String codigo) {
        return cache.porId().values().stream()
                .filter(c -> c.ambito() == ambito && c.codigo().equals(codigo))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Falta la categoría " + ambito + "/" + codigo + " en def_categoria"));
    }

    public String nombre(Integer categoriaId) {
        CategoriaInfo c = cache.porId().get(categoriaId);
        return c == null ? null : c.nombre();
    }
}
