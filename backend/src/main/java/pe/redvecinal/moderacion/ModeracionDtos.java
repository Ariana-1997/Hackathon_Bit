package pe.redvecinal.moderacion;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
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

    public record DenunciaResponse(UUID id, UUID denuncianteId, UUID publicacionId, UUID usuarioDenunciadoId,
                                   String motivo, EstadoDenuncia estado, AccionModeracion accion,
                                   String justificacion, OffsetDateTime createdAt, OffsetDateTime resueltaEn) {}
}
