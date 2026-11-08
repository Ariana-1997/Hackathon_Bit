-- =====================================================================
-- V2: se elimina el concepto de roles. Todos los usuarios tienen el mismo
-- nivel de acceso; la autorización depende solo de estar autenticado.
-- =====================================================================
drop index if exists ix_usuario_rol;
alter table mae_usuario drop column if exists rol_id;
drop table if exists def_rol;
