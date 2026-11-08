package pe.redvecinal.emergencias;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReporteRepository extends JpaRepository<ReporteHumanitario, UUID> {

    /** RF35: cola del dashboard. Usa ix_reporte_cola (estado abierto/en atención). Prioridad desc = CRITICA primero. */
    @Query("""
           select r from ReporteHumanitario r
           where r.zonaId = :zonaId
             and r.estado in (pe.redvecinal.emergencias.EstadoReporte.ABIERTA, pe.redvecinal.emergencias.EstadoReporte.EN_ATENCION)
           order by r.prioridad desc, r.createdAt asc
           """)
    List<ReporteHumanitario> activosDeZona(@Param("zonaId") UUID zonaId);

    Page<ReporteHumanitario> findByReportanteIdOrderByCreatedAtDesc(UUID reportanteId, Pageable pageable);
}
