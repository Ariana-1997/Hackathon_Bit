package pe.redvecinal.usuarios.domain;

import java.util.Arrays;

/** Espejo de def_rol (ids fijos sembrados por el script bd_v2). RF02 / RF08. */
public enum RolUsuario {
    VECINO((short) 1), PRESTADOR((short) 2), ADMIN((short) 3);

    private final short id;

    RolUsuario(short id) { this.id = id; }

    public short getId() { return id; }

    public static RolUsuario deId(short id) {
        return Arrays.stream(values()).filter(r -> r.id == id).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Rol desconocido: " + id));
    }
}
