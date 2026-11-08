package pe.redvecinal.shared.security;

import java.util.UUID;
import pe.redvecinal.shared.exception.ApiException;
import pe.redvecinal.usuarios.domain.EstadoUsuario;
import pe.redvecinal.usuarios.domain.RolUsuario;

/**
 * Principal disponible en los controladores con @AuthenticationPrincipal.
 * id = mae_usuario.id (NO es el id de Supabase Auth).
 */
public record UsuarioAutenticado(UUID id, UUID authUserId, RolUsuario rol, UUID zonaId, EstadoUsuario estado) {

    public boolean esAdmin() { return rol == RolUsuario.ADMIN; }

    public boolean activo() { return estado == EstadoUsuario.ACTIVO; }

    /** Muchas operaciones requieren que el vecino ya esté asociado a una zona (RF10). */
    public UUID zonaObligatoria() {
        if (zonaId == null) {
            throw ApiException.reglaNegocio("SIN_ZONA",
                    "Primero comparte tu ubicación para asociarte a tu comunidad.");
        }
        return zonaId;
    }

    /** RNF-15: solo el dueño, salvo administradores. */
    public void exigirDuenioOAdmin(UUID duenioId) {
        if (!id.equals(duenioId) && !esAdmin()) {
            throw ApiException.prohibido("Solo puedes modificar tus propias publicaciones.");
        }
    }

    public void exigirDuenio(UUID duenioId) {
        if (!id.equals(duenioId)) {
            throw ApiException.prohibido("Solo el autor puede realizar esta acción.");
        }
    }
}
