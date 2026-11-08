package pe.redvecinal.shared.security;

import java.util.UUID;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.usuarios.domain.EstadoUsuario;

/**
 * Principal disponible en los controladores con @AuthenticationPrincipal.
 * id = mae_usuario.id (NO es el id de Supabase Auth).
 */
public record UsuarioAutenticado(UUID id, UUID authUserId, UUID zonaId, EstadoUsuario estado) {

    public boolean activo() { return estado == EstadoUsuario.ACTIVO; }

    /** Muchas operaciones requieren que el vecino ya esté asociado a una zona (RF10). */
    public UUID zonaObligatoria() {
        if (zonaId == null) {
            throw ApiException.reglaNegocio("SIN_ZONA",
                    "Primero comparte tu ubicación para asociarte a tu comunidad.");
        }
        return zonaId;
    }

    /** RNF-15: solo el dueño puede modificar sus recursos. */
    public void exigirDuenio(UUID duenioId) {
        if (!id.equals(duenioId)) {
            throw ApiException.prohibido("Solo el autor puede realizar esta acción.");
        }
    }
}
