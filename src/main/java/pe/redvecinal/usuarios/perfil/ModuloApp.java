package pe.redvecinal.usuarios.perfil;

import java.util.EnumSet;
import java.util.Set;

/** RF02: vistas/módulos que el frontend debe mostrar. Sin roles, todos los usuarios ven los mismos. */
public enum ModuloApp {
    SERVICIOS, SOLIDARIDAD, EMERGENCIAS, DIRECTORIO_SOPORTE, NOTIFICACIONES, MIS_SERVICIOS;

    public static Set<ModuloApp> todos() {
        return EnumSet.allOf(ModuloApp.class);
    }
}
