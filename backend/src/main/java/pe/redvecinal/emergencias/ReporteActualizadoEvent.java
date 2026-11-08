package pe.redvecinal.emergencias;

import java.util.UUID;
import pe.redvecinal.emergencias.EmergenciaDtos.ReportePublico;

/** Se publica dentro de la transacción y se emite por SSE solo si hace commit. */
public record ReporteActualizadoEvent(UUID zonaId, String evento, ReportePublico reporte) {}
