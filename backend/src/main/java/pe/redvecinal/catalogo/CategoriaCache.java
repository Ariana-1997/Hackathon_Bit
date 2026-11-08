package pe.redvecinal.catalogo;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.redvecinal.shared.config.CacheConfig;

/** Catálogo completo en memoria (son pocas filas y cambian poco) -> validaciones sin ir a la BD (RNF-06). */
@Component
@RequiredArgsConstructor
public class CategoriaCache {

    private final CategoriaRepository repository;

    public record CategoriaInfo(Integer id, AmbitoCategoria ambito, Integer padreId, String codigo, String nombre) {}

    @Cacheable(CacheConfig.CATEGORIAS)
    @Transactional(readOnly = true)
    public Map<Integer, CategoriaInfo> porId() {
        return repository.findByActivaTrueOrderByNombre().stream()
                .map(c -> new CategoriaInfo(c.getId(), c.getAmbito(), c.getPadreId(), c.getCodigo(), c.getNombre()))
                .collect(Collectors.toUnmodifiableMap(CategoriaInfo::id, Function.identity()));
    }
}
