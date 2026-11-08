package pe.redvecinal.moderacion;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class ModeracionDtos {

    private ModeracionDtos() {}

    /** RF46: se denuncia una publicación O un usuario (exactamente uno, como exige ck_denuncia_objetivo). */
    public record DenunciaRequest(UUID publicacionId, UUID usuarioDenunciadoId,
                                  @NotBlank(message = "Cuéntanos el motivo") @Size(max = 500) String motivo) {
        @AssertTrue(message = "Indica una publicación o un usuario, no ambos")
        public boolean isObjetivoUnico() {
            return (publicacionId == null) != (usuarioDenunciadoId == null);
        }
    }

    /** RF47: justificación obligatoria (mín. 10 caracteres, igual que ck_denuncia_resolucion). */
    public record ResolverRequest(
            @NotNull EstadoDenuncia estado,
            @NotNull AccionModeracion accion,
            @NotBlank(message = "La justificación es obligatoria")
            @Size(min = 10, max = 1000, message = "Entre 10 y 1000 caracteres") String justificacion) {}

    public record ModerarPublicacionRequest(
            @NotNull AccionModeracion accion,
            @NotBlank @Size(min = 10, max = 500, message = "Entre 10 y 500 caracteres") String justificacion) {}

    public record DenunciaResponse(UUID id, UUID denuncianteId, UUID publicacionId, UUID usuarioDenunciadoId,
                                   String motivo, EstadoDenuncia estado, AccionModeracion accion,
                                   String justificacionAdmin, OffsetDateTime createdAt, OffsetDateTime resueltaEn) {}
}
