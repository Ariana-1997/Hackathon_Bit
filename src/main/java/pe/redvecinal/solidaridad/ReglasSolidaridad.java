package pe.redvecinal.solidaridad;

import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;
import pe.redvecinal.publicaciones.TipoPublicacion;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.solidaridad.SolidaridadDtos.CrearRequest;

/**
 * Reglas por tipo de publicación solidaria y categoría por defecto (RF21-RF27).
 * Para agregar un tipo nuevo basta con registrar su regla aquí (RNF-45).
 */
@Component
public class ReglasSolidaridad {

    private final Map<TipoPublicacion, Consumer<CrearRequest>> reglas = new EnumMap<>(TipoPublicacion.class);
    private final Map<TipoPublicacion, String> categoriaPorDefecto = new EnumMap<>(TipoPublicacion.class);

    public ReglasSolidaridad() {
        registrar(TipoPublicacion.SOLICITUD_AYUDA, "AYUDA_GENERAL", r ->
                exigir(r.justificacion(), "justificacion", "Explica por qué necesitas la ayuda."));
        registrar(TipoPublicacion.PRESTAMO_HERRAMIENTA, "HERRAMIENTAS", r -> {
            exigir(r.cantidad(), "cantidad", "Indica cuántas unidades prestas.");
            exigir(r.condicionesUso(), "condicionesUso", "Indica las condiciones de uso.");
        });
        registrar(TipoPublicacion.DONACION_MATERIAL, "MATERIALES", r ->
                exigir(r.condicionesUso(), "condicionesUso", "Describe el estado del material (inspección visual)."));
        registrar(TipoPublicacion.INTERCAMBIO_HABILIDAD, "HABILIDADES", r -> { });
        registrar(TipoPublicacion.TRANSPORTE_SOLIDARIO, "TRANSPORTE", r -> {
            exigir(r.origenTexto(), "origenTexto", "Indica el origen.");
            exigir(r.destinoTexto(), "destinoTexto", "Indica el destino.");
            exigir(r.fechaSalida(), "fechaSalida", "Indica la fecha y hora de salida.");
            exigir(r.asientos(), "asientos", "Indica los asientos disponibles.");
            if (r.fechaSalida().isBefore(OffsetDateTime.now())) {
                throw ApiException.reglaNegocio("FECHA_PASADA", "La fecha de salida ya pasó.");
            }
        });
    }

    private void registrar(TipoPublicacion tipo, String codigoCategoria, Consumer<CrearRequest> regla) {
        reglas.put(tipo, regla);
        categoriaPorDefecto.put(tipo, codigoCategoria);
    }

    public void validar(CrearRequest r, UUID autorId) {
        Consumer<CrearRequest> regla = reglas.get(r.tipo());
        if (regla == null) {
            throw ApiException.reglaNegocio("TIPO_INVALIDO", "Ese tipo no corresponde a la cadena de favores.");
        }
        regla.accept(r);
        if (r.fechaNecesaria() != null && r.fechaDevolucionPrevista() != null
                && r.fechaDevolucionPrevista().isBefore(r.fechaNecesaria())) {
            throw ApiException.reglaNegocio("FECHAS_INVALIDAS", "La devolución no puede ser antes de la fecha necesaria.");
        }
        // Las fotos deben haberse subido a la carpeta del propio usuario (ver ArchivoController)
        List<String> fotos = r.fotosRutas() == null ? List.of() : r.fotosRutas();
        String prefijo = autorId + "/";
        if (fotos.stream().anyMatch(f -> f == null || !f.startsWith(prefijo) || f.contains(".."))) {
            throw ApiException.reglaNegocio("FOTO_INVALIDA", "Alguna foto no pertenece a tu cuenta.");
        }
    }

    /** RF27: categorización automática cuando el vecino no elige categoría. */
    public String codigoCategoriaPorDefecto(TipoPublicacion tipo) {
        return categoriaPorDefecto.get(tipo);
    }

    private static void exigir(Object valor, String campo, String mensaje) {
        if (valor == null || (valor instanceof String s && s.isBlank())) {
            throw ApiException.reglaNegocio("CAMPO_REQUERIDO_" + campo.toUpperCase(), mensaje);
        }
    }
}
