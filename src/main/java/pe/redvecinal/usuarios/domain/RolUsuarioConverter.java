package pe.redvecinal.usuarios.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Guarda el enum como mae_usuario.rol_id (smallint). */
@Converter
public class RolUsuarioConverter implements AttributeConverter<RolUsuario, Short> {

    @Override
    public Short convertToDatabaseColumn(RolUsuario rol) { return rol == null ? null : rol.getId(); }

    @Override
    public RolUsuario convertToEntityAttribute(Short id) { return id == null ? null : RolUsuario.deId(id); }
}
