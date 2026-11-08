package pe.redvecinal.solidaridad;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import pe.redvecinal.publicaciones.Publicacion;

/** Bitácora/feed de solidaridad: un solo SELECT por página (RNF-04, RNF-09). */
public interface SolidaridadQueryRepository extends Repository<Publicacion, UUID> {

    interface FeedView {
        String getId();
        String getTipo();
        String getTitulo();
        String getResumen();
        String getCategoriaNombre();
        String getEstado();
        String getAutorNombre();
        Double getLat();
        Double getLng();
        Double getDistanciaM();
        Long getCreadoEpochMs();
    }

    String COLUMNAS = """
            cast(p.id as text) as id, cast(p.tipo as text) as tipo, p.titulo as titulo,
            left(p.descripcion, 200) as resumen, c.nombre as "categoriaNombre", cast(p.estado as text) as estado,
            u.nombre as "autorNombre",
            ST_Y(cast(p.ubicacion as geometry)) as lat, ST_X(cast(p.ubicacion as geometry)) as lng,
            cast(extract(epoch from p.created_at) * 1000 as bigint) as "creadoEpochMs"
            """;

    String BASE = """
            from mae_publicacion p
            join def_categoria c on c.id = p.categoria_id
            join mae_usuario u on u.id = p.autor_id
            where p.deleted_at is null and p.modulo = 'SOLIDARIDAD' and p.estado in ('ACTIVA','EN_CURSO')
              and (cast(:tipo as text) is null or cast(p.tipo as text) = :tipo)
            """;

    /** RF28/RF29: bandeja unificada por fecha, filtrable por tipo de requerimiento. */
    @Query(value = "select " + COLUMNAS + ", cast(null as double precision) as \"distanciaM\" " + BASE
                   + " and p.zona_id = :zonaId order by p.created_at desc",
           countQuery = "select count(*) " + BASE + " and p.zona_id = :zonaId",
           nativeQuery = true)
    Page<FeedView> feed(@Param("zonaId") UUID zonaId, @Param("tipo") String tipo, Pageable pageable);

    /** RF29: filtrado por cercanía (radio en metros). */
    @Query(value = "select " + COLUMNAS + """
            , ST_Distance(p.ubicacion, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography)) as "distanciaM"
            """ + BASE + """
              and ST_DWithin(p.ubicacion, cast(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) as geography), :radioM)
            order by "distanciaM"
            limit 200
            """, nativeQuery = true)
    List<FeedView> cercanos(@Param("lat") double lat, @Param("lng") double lng, @Param("radioM") double radioM,
                            @Param("tipo") String tipo);
}
