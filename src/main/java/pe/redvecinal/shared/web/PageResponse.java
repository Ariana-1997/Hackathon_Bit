package pe.redvecinal.shared.web;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/** Respuesta paginada estándar (RNF-04, RNF-44). */
public record PageResponse<T>(List<T> contenido, int pagina, int tamanio, long totalElementos,
                              int totalPaginas, boolean ultima) {

    public static final int TAMANIO_MAXIMO = 50;

    public static <T> PageResponse<T> de(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public static <S, T> PageResponse<T> de(Page<S> page, Function<S, T> mapper) {
        return de(page.map(mapper));
    }

    /** Normaliza los parámetros page/size recibidos del cliente. */
    public static Pageable pagina(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), TAMANIO_MAXIMO));
    }
}
