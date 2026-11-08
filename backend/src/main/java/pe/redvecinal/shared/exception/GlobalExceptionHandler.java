package pe.redvecinal.shared.exception;

import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;
import org.slf4j.MDC;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Formato único de error (RFC 7807 / ProblemDetail) para toda la API (RNF-22, RNF-39, RNF-44).
 * Campos: status, title, detail, codigo, requestId, timestamp y, en validaciones, "errores" por campo.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ProblemDetail> api(ApiException ex) {
        return responder(ex.getStatus(), ex.getCodigo(), ex.getMessage());
    }

    @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
    ResponseEntity<ProblemDetail> denegado(RuntimeException ex) {
        return responder(HttpStatus.FORBIDDEN, "SIN_PERMISO", "No tienes permiso para realizar esta acción.");
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ProblemDetail> concurrencia(ObjectOptimisticLockingFailureException ex) {
        return responder(HttpStatus.CONFLICT, "MODIFICADO_POR_OTRO",
                "Otro usuario modificó este registro. Actualiza la pantalla e inténtalo de nuevo.");
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ProblemDetail> restricciones(ConstraintViolationException ex) {
        ProblemDetail pd = problema(HttpStatus.BAD_REQUEST, "VALIDACION", "Revisa los datos ingresados.");
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(v -> errores.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        pd.setProperty("errores", errores);
        return ResponseEntity.badRequest().body(pd);
    }

    /** Traduce errores de PostgreSQL (constraints y triggers de bd_v2) a mensajes comprensibles. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ProblemDetail> integridad(DataIntegrityViolationException ex) {
        Throwable causa = NestedExceptionUtils.getMostSpecificCause(ex);
        if (causa instanceof PSQLException psql) {
            ServerErrorMessage sem = psql.getServerErrorMessage();
            String estado = psql.getSQLState();
            String restriccion = sem != null ? sem.getConstraint() : null;
            if ("23505".equals(estado)) {
                return responder(HttpStatus.CONFLICT, "DUPLICADO", "Ya existe un registro igual (" + restriccion + ").");
            }
            if ("23514".equals(estado)) {
                // Sin nombre de constraint => lo lanzó un trigger (RF43, RF44, autopostulación): mensaje de negocio.
                if (restriccion == null && sem != null) {
                    return responder(HttpStatus.UNPROCESSABLE_ENTITY, "REGLA_NEGOCIO", sem.getMessage());
                }
                return responder(HttpStatus.BAD_REQUEST, "DATO_INVALIDO", "Un dato no cumple la regla " + restriccion + ".");
            }
            if ("23503".equals(estado)) {
                return responder(HttpStatus.BAD_REQUEST, "REFERENCIA_INVALIDA", "Se hace referencia a un registro inexistente.");
            }
            if ("42501".equals(estado)) {
                return responder(HttpStatus.FORBIDDEN, "OPERACION_NO_PERMITIDA", sem != null ? sem.getMessage() : "Operación no permitida.");
            }
        }
        log.warn("Violación de integridad no clasificada", ex);
        return responder(HttpStatus.CONFLICT, "INTEGRIDAD", "La operación no se pudo completar por una regla de datos.");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> inesperado(Exception ex) {
        log.error("Error no controlado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO",
                "Ocurrió un problema inesperado. Inténtalo nuevamente en unos minutos.");
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        ProblemDetail pd = problema(HttpStatus.BAD_REQUEST, "VALIDACION", "Revisa los datos ingresados.");
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe -> errores.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        ex.getBindingResult().getGlobalErrors().forEach(ge -> errores.putIfAbsent(ge.getObjectName(), ge.getDefaultMessage()));
        pd.setProperty("errores", errores);
        return ResponseEntity.badRequest().body(pd);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpHeaders headers,
                                                                  HttpStatusCode status, WebRequest request) {
        return ResponseEntity.badRequest().body(problema(HttpStatus.BAD_REQUEST, "JSON_INVALIDO",
                "El cuerpo de la petición no tiene un formato válido."));
    }

    private ResponseEntity<ProblemDetail> responder(HttpStatus status, String codigo, String detalle) {
        return ResponseEntity.status(status).body(problema(status, codigo, detalle));
    }

    static ProblemDetail problema(HttpStatus status, String codigo, String detalle) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detalle);
        pd.setTitle(status.getReasonPhrase());
        pd.setProperty("codigo", codigo);
        pd.setProperty("requestId", MDC.get("requestId"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }
}
