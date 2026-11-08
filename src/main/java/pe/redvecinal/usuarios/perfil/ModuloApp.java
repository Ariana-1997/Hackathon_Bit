package pe.redvecinal.usuarios.perfil;

import java.util.EnumSet;
import java.util.Set;
import pe.redvecinal.usuarios.domain.RolUsuario;

/** RF02: vistas/módulos que el frontend debe mostrar según el rol. El backend igual valida cada endpoint (RF08). */
public enum ModuloApp {
    SERVICIOS, SOLIDARIDAD, EMERGENCIAS, DIRECTORIO_SOPORTE, NOTIFICACIONES,
    MIS_SERVICIOS, RECURSOS,
    ADMIN_DASHBOARD_EMERGENCIAS, ADMIN_MODERACION, ADMIN_CONTACTOS;

    public static Set<ModuloApp> para(RolUsuario rol) {
        Set<ModuloApp> base = EnumSet.of(SERVICIOS, SOLIDARIDAD, EMERGENCIAS, DIRECTORIO_SOPORTE, NOTIFICACIONES);
        switch (rol) {
            case PRESTADOR -> base.addAll(EnumSet.of(MIS_SERVICIOS, RECURSOS));
            case ADMIN -> base.addAll(EnumSet.of(RECURSOS, ADMIN_DASHBOARD_EMERGENCIAS, ADMIN_MODERACION, ADMIN_CONTACTOS));
            default -> { }
        }
        return base;
    }
}
