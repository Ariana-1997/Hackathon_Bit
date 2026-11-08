package pe.redvecinal.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Excepción base de negocio: lleva estado HTTP, código estable para el frontend y mensaje legible (RNF-39). */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;

    public ApiException(HttpStatus status, String codigo, String mensaje) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
    }

    public static ApiException noEncontrado(String recurso) {
        return new ApiException(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", recurso + " no existe o ya no está disponible.");
    }

    public static ApiException reglaNegocio(String codigo, String mensaje) {
        return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, codigo, mensaje);
    }

    public static ApiException conflicto(String codigo, String mensaje) {
        return new ApiException(HttpStatus.CONFLICT, codigo, mensaje);
    }

    public static ApiException prohibido(String mensaje) {
        return new ApiException(HttpStatus.FORBIDDEN, "SIN_PERMISO", mensaje);
    }

    public static ApiException noAutorizado(String codigo, String mensaje) {
        return new ApiException(HttpStatus.UNAUTHORIZED, codigo, mensaje);
    }
}
