-- =====================================================================
-- V3: moderación automática por denuncias y limpieza de lo que quedó
--     huérfano al eliminar los roles (V2).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Inventario y asignación de recursos (RF36-RF38): sin código que los use.
-- ---------------------------------------------------------------------
drop table if exists det_asignacion_recurso;
drop table if exists mae_recurso;
drop type  if exists estado_asignacion;

-- Las categorías de ámbito RECURSO solo las usaba mae_recurso.
delete from def_categoria where ambito = 'RECURSO';

alter type ambito_categoria rename to ambito_categoria_old;
create type ambito_categoria as enum ('ECONOMIA','SOLIDARIDAD','NECESIDAD');
alter table def_categoria
  alter column ambito type ambito_categoria using ambito::text::ambito_categoria;
drop type ambito_categoria_old;

-- ---------------------------------------------------------------------
-- 2) Tipos de notificación que ya nada genera. Las filas antiguas pasan a SISTEMA.
-- ---------------------------------------------------------------------
alter type tipo_notificacion rename to tipo_notificacion_old;
create type tipo_notificacion as enum (
  'RESPUESTA_A_PUBLICACION','INTERACCION_ACEPTADA','INTERACCION_RECHAZADA','NUEVA_VALORACION',
  'NUEVA_ALERTA_EMERGENCIA','MODERACION','SISTEMA');
alter table det_notificacion
  alter column tipo type tipo_notificacion using (
    case when tipo::text in ('CAMBIO_ESTADO_REPORTE','RECURSO_ASIGNADO') then 'SISTEMA'
         else tipo::text end)::tipo_notificacion;
drop type tipo_notificacion_old;

-- ---------------------------------------------------------------------
-- 3) Bitácora: ya no se registran ASIGNACION. La bitácora es inalterable (RF40),
--    por eso el nuevo CHECK es NOT VALID: aplica a filas nuevas sin tocar las antiguas.
-- ---------------------------------------------------------------------
alter table det_historial_estado drop constraint if exists det_historial_estado_entidad_tipo_check;
alter table det_historial_estado add constraint ck_historial_entidad
  check (entidad_tipo in ('PUBLICACION','INTERACCION','REPORTE','DENUNCIA')) not valid;

-- ---------------------------------------------------------------------
-- 4) Denuncias: sin administradores, las resuelve el sistema (resuelta_por_id = null)
--    al ocultar la publicación por acumulación de denuncias.
-- ---------------------------------------------------------------------
alter table det_denuncia rename column justificacion_admin to justificacion;
alter table det_denuncia drop constraint ck_denuncia_resolucion;
alter table det_denuncia add constraint ck_denuncia_resolucion check (
  estado = 'PENDIENTE' or
  (resuelta_en is not null and accion is not null
   and char_length(trim(coalesce(justificacion, ''))) >= 10));

comment on column det_denuncia.resuelta_por_id is 'null = resuelta automáticamente por el sistema';
