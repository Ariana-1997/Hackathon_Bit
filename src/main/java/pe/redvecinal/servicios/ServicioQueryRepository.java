package pe.redvecinal.servicios;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import pe.redvecinal.publicaciones.Publicacion;

/**
 * Lecturas del catálogo con SQL nativo: un solo JOIN por listado (sin N+1), índices GiST/trigram,
 * paginación (RNF-03, RNF-04, RNF-05, RNF-09). Ids y fechas se proyectan como texto/epoch para
 * evitar ambigüedades de tipos en consultas nativas.
 */
public interface ServicioQueryRepository extends Repository<Publicacion, UUID> {

    interface ServicioResumenView {
        String getId();
        String getTitulo();
        String getNombreComercial();
        String getMarca();
        Integer getCategoriaId();
        String getCategoriaNombre();
        BigDecimal getPrecioDesde();
        String getMoneda();
        BigDecimal getPromedioValoracion();
        Integer getTotalValoraciones();
        Double getLat();
        Double getLng();
        Double getDistanciaM();
    }

    interface SugerenciaView {
        String getId();
        String getNombreComercial();
        String getTitulo();
    }

    String COLUMNAS = """
            cast(p.id as text) as id, p.titulo as titulo, s.nombre_comercial as "nombreComercial", s.marca as marca,
            c.id as "categoriaId", c.nombre as "categoriaNombre", s.precio_desde as "precioDesde", s.moneda as moneda,
            s.promedio_valoracion as "promedioValoracion", s.total_valoraciones as "totalValoraciones",
            ST_Y(cast(p.ubicacion as geometry)) as lat, ST_X(cast(p.ubicacion as geometry)) as lng
            """;

    String BASE = """
            from mae_publicacion p
            join det_servicio s on s.publicacion_id = p.id
            join def_categoria c on c.id = p.categoria_id
            where p.deleted_at is null and p.modulo = 'ECONOMIA' and p.estado = 'ACTIVA'
            """;

    String FILTROS = """
            and p.zona_id = :zonaId
            and (cast(:categoriaId as integer) is null or c.id = :categoriaId or c.padre_id = :categoriaId)
            and (cast(:marca as text) is null or s.marca ilike :marca)
            """;

    /** RF15 / RF17: directorio de prestadores activos con filtros por categoría (incluye subcategorías) y marca. */
    @Query(value = "select " + COLUMNAS + ", cast(null as double precision) as \"distanciaM\" " + BASE + FILTROS
                   + " order by s.promedio_valoracion desc, p.created_at desc",
           countQuery = "select count(*) " + BASE + FILTROS,
           nativeQuery = true)
    Page<ServicioResumenView> catalogo(@Param("zonaId") UUID zonaId, @Param("categoriaId") Integer categoriaId,
                                       @Param("marca") String marcaPatron, Pageable pageable);

    /** RF16: autocompletado por nombre (índices gin_trgm_ops). */
    @Query(value = """
            select cast(p.id as text) as id, s.nombre_comercial as "nombreComercial", p.titulo as titulo
            from mae_publicacion p join det_servicio s on s.publicacion_id = p.id
            where p.deleted_at is null and p.modulo = 'ECONOMIA' and p.estado = 'ACTIVA' and p.zona_id = :zonaId
              and (s.nombre_comercial ilike :patron or p.titulo ilike :patron)
            order by greatest(similarity(s.nombre_comercial, :texto), similarity(p.titulo, :texto)) desc
            limit 10
            """, nativeQuery = true)
    List<SugerenciaView> autocompletar(@Param("zonaId") UUID zonaId, @Param("patron") String patron,
                                       @Param("texto") String texto);

    /** RF18 / RF19: servicios dentro de un radio (metros), ordenados por distancia. Usa ix_publicacion_ubicacion. */
    @Query(value = "select " + COLUMNAS + """
            , ST_Distance(p.ubicacion, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography)) as "distanciaM"
            """ + BASE + """
            and ST_DWithin(p.ubicacion, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography), :radioM)
            and (cast(:categoriaId as integer) is null or c.id = :categoriaId or c.padre_id = :categoriaId)
            order by "distanciaM"
            limit :limite
            """, nativeQuery = true)
    List<ServicioResumenView> cercanos(@Param("lat") double lat, @Param("lng") double lng, @Param("radioM") double radioM,
                                       @Param("categoriaId") Integer categoriaId, @Param("limite") int limite);
}
