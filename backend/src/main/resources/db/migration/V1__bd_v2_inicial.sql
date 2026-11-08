-- ============================================================================
-- BD v2 - PWA comunitaria (PostgreSQL / Supabase)  |  18 tablas
-- Convencion de nombres:
--   DEF_  definiciones / catalogos     (def_rol, def_categoria, def_contacto_soporte)
--   MAE_  entidades maestras           (mae_zona, mae_usuario, mae_publicacion,
--                                       mae_reporte_humanitario, mae_recurso)
--   DET_  detalle / dependientes / relaciones / bitacoras
-- Ejecutar UNA sola vez sobre un proyecto Supabase vacio. NO PROBADO todavia.
-- Cambios frente a v1: sin imagenes (fotos en det_solidaridad), sin roles multiples,
-- sin Visto Bueno, sin necesidad separada, sin tabla de sincronizacion offline;
-- con denuncias, contactos de soporte, bloqueo de login y jerarquia de categorias.
-- ============================================================================

-- ============================ 1. EXTENSIONES ================================
create extension if not exists postgis;     -- proximidad (ST_DWithin), zonas, mapas
create extension if not exists pg_trgm;     -- autocompletado por nombre (RF16)

-- ============================ 2. ENUMs ======================================
create type estado_usuario       as enum ('ACTIVO','SUSPENDIDO');
create type modulo_publicacion   as enum ('ECONOMIA','SOLIDARIDAD');
create type tipo_publicacion     as enum (
  'SERVICIO',                                                       -- ECONOMIA
  'SOLICITUD_AYUDA','PRESTAMO_HERRAMIENTA','DONACION_MATERIAL',
  'INTERCAMBIO_HABILIDAD','TRANSPORTE_SOLIDARIO');                  -- SOLIDARIDAD
create type estado_publicacion   as enum ('ACTIVA','INACTIVA','EN_CURSO','COMPLETADA','CANCELADA','EXPIRADA','MODERADA');
create type estado_interaccion   as enum ('PENDIENTE','ACEPTADA','RECHAZADA','RETIRADA','COMPLETADA');
create type ambito_categoria     as enum ('ECONOMIA','SOLIDARIDAD','NECESIDAD','RECURSO');
create type tipo_reporte         as enum ('ALERTA_EMERGENCIA','NECESIDAD_CRITICA');      -- RF31 / RF32
create type prioridad_emergencia as enum ('BAJA','MEDIA','ALTA','CRITICA');
create type estado_reporte       as enum ('ABIERTA','EN_ATENCION','ATENDIDA','DESCARTADA');
create type estado_asignacion    as enum ('RESERVADA','ENTREGADA','CANCELADA');
create type estado_denuncia      as enum ('PENDIENTE','RESUELTA','RECHAZADA');
create type accion_moderacion    as enum ('NINGUNA','OCULTAR','ELIMINAR','SUSPENDER_USUARIO');
create type tipo_notificacion    as enum (
  'RESPUESTA_A_PUBLICACION','INTERACCION_ACEPTADA','INTERACCION_RECHAZADA','NUEVA_VALORACION',
  'NUEVA_ALERTA_EMERGENCIA','CAMBIO_ESTADO_REPORTE','RECURSO_ASIGNADO','MODERACION','SISTEMA');

-- ============================ 3. CATALOGOS Y ZONA ===========================
-- ---- DEF_ROL (RF02, RF08) ----
create table def_rol (
  id          smallint     primary key,
  codigo      varchar(40)  not null unique,
  nombre      varchar(80)  not null,
  descripcion varchar(255)
);
insert into def_rol (id, codigo, nombre, descripcion) values
  (1, 'VECINO',    'Vecino',        'Usuario de la comunidad'),
  (2, 'PRESTADOR', 'Prestador',     'Vecino que ofrece servicios u oficios (incluye permisos de vecino)'),
  (3, 'ADMIN',     'Administrador', 'Modera, coordina emergencias y recursos');

-- ---- MAE_ZONA (RF10) ----
-- Se define por poligono (limite) o, mientras no haya poligonos, por centro + radio.
create table mae_zona (
  id         uuid         primary key default gen_random_uuid(),
  codigo     varchar(30)  not null unique,
  nombre     varchar(120) not null,
  centro     geography(Point,4326) not null,
  radio_m    integer      check (radio_m is null or radio_m between 100 and 50000),
  limite     geography(MultiPolygon,4326),
  activa     boolean      not null default true,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now(),
  constraint ck_zona_definicion check (limite is not null or radio_m is not null)
);

-- ---- DEF_CATEGORIA (jerarquica, RF12) ----
create table def_categoria (
  id        integer generated always as identity primary key,
  ambito    ambito_categoria not null,
  padre_id  integer references def_categoria(id),
  codigo    varchar(50)  not null,
  nombre    varchar(100) not null,
  activa    boolean      not null default true,
  unique (ambito, codigo),
  constraint ck_categoria_no_autopadre check (padre_id is null or padre_id <> id)
);

-- Categorias raiz
insert into def_categoria (ambito, codigo, nombre) values
  ('ECONOMIA','HOGAR','Hogar y construcción'),
  ('ECONOMIA','VEHICULOS','Vehículos'),
  ('ECONOMIA','PERSONAL','Cuidado personal y de personas'),
  ('ECONOMIA','ALIMENTACION','Alimentación y comercio'),
  ('ECONOMIA','TECNOLOGIA','Tecnología'),
  ('ECONOMIA','EDUCACION','Educación'),
  ('ECONOMIA','OTROS','Otros servicios'),
  ('SOLIDARIDAD','AYUDA_GENERAL','Ayuda general'),
  ('SOLIDARIDAD','HERRAMIENTAS','Préstamo de herramientas'),
  ('SOLIDARIDAD','MATERIALES','Donación de materiales'),
  ('SOLIDARIDAD','HABILIDADES','Intercambio de habilidades'),
  ('SOLIDARIDAD','TRANSPORTE','Transporte solidario'),
  ('NECESIDAD','ALIMENTOS','Alimentos'),
  ('NECESIDAD','AGUA','Agua potable'),
  ('NECESIDAD','MEDICAMENTOS','Medicamentos'),
  ('NECESIDAD','ABRIGO','Abrigo y ropa'),
  ('NECESIDAD','ALBERGUE','Albergue temporal'),
  ('NECESIDAD','ATENCION_MEDICA','Atención médica'),
  ('NECESIDAD','HIGIENE','Higiene'),
  ('NECESIDAD','TRANSPORTE_EMERGENCIA','Transporte de emergencia'),
  ('NECESIDAD','CUIDADO_DEPENDIENTES','Cuidado de menores / adultos mayores'),
  ('RECURSO','ALIMENTOS','Alimentos'),
  ('RECURSO','AGUA','Agua'),
  ('RECURSO','KIT_HIGIENE','Kits de higiene'),
  ('RECURSO','MANTAS','Mantas y abrigo'),
  ('RECURSO','MEDICAMENTOS','Medicamentos básicos'),
  ('RECURSO','VEHICULO','Vehículo'),
  ('RECURSO','VOLUNTARIOS','Voluntarios');

-- Subcategorias de ECONOMIA (hijas de las raices)
insert into def_categoria (ambito, padre_id, codigo, nombre)
select 'ECONOMIA'::ambito_categoria, p.id, v.codigo, v.nombre
from (values
  ('HOGAR','PLOMERIA','Plomería'),
  ('HOGAR','ELECTRICIDAD','Electricidad'),
  ('HOGAR','CARPINTERIA','Carpintería'),
  ('HOGAR','ALBANILERIA','Albañilería'),
  ('HOGAR','PINTURA','Pintura'),
  ('HOGAR','JARDINERIA','Jardinería'),
  ('HOGAR','LIMPIEZA','Limpieza'),
  ('VEHICULOS','MECANICA','Mecánica'),
  ('PERSONAL','BELLEZA','Peluquería y belleza'),
  ('PERSONAL','CUIDADO_PERSONAS','Cuidado de personas'),
  ('PERSONAL','COSTURA','Costura y confección'),
  ('ALIMENTACION','COMIDAS','Comidas y restaurantes'),
  ('ALIMENTACION','TIENDA','Tienda de barrio'),
  ('TECNOLOGIA','REPARACIONES','Reparación de equipos'),
  ('EDUCACION','REFUERZO','Clases y refuerzo escolar')
) as v(padre, codigo, nombre)
join def_categoria p on p.ambito = 'ECONOMIA' and p.codigo = v.padre;

-- ---- DEF_CONTACTO_SOPORTE (RF50) ---- (sin datos: los carga el administrador)
create table def_contacto_soporte (
  id          uuid         primary key default gen_random_uuid(),
  zona_id     uuid         references mae_zona(id),            -- null = visible en todas las zonas
  nombre      varchar(120) not null,
  descripcion varchar(255),
  telefono    varchar(20)  check (telefono is null or telefono ~ '^\+?[0-9]{3,15}$'),
  enlace      varchar(255),
  orden       smallint     not null default 0,
  activo      boolean      not null default true,
  created_at  timestamptz  not null default now(),
  constraint ck_contacto_medio check (telefono is not null or enlace is not null)
);

-- ============================ 4. USUARIOS ===================================
-- La contrasena/correo viven en Supabase Auth (auth.users); aqui solo el perfil.
create table mae_usuario (
  id                   uuid        primary key default gen_random_uuid(),
  auth_user_id         uuid        not null unique references auth.users(id) on delete restrict,
  rol_id               smallint    not null default 1 references def_rol(id),
  nombre               varchar(120) not null,                                   -- RF07
  telefono             varchar(9)  check (telefono is null or telefono ~ '^[0-9]{9}$'),  -- RF07
  zona_id              uuid        references mae_zona(id),                     -- RF10
  ubicacion            geography(Point,4326),                                   -- RF09 (el backend la guarda aproximada)
  estado               estado_usuario not null default 'ACTIVO',
  intentos_fallidos    smallint    not null default 0 check (intentos_fallidos >= 0),   -- RF06
  bloqueado_hasta      timestamptz,                                                     -- RF06 (5 min)
  tutorial_completado  boolean     not null default false,                      -- RF49
  version              bigint      not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

-- ============================ 5. PUBLICACIONES ==============================
-- Base comun de Servicios (ECONOMIA) y Solidaridad. Lo humanitario va aparte (seccion 8).
create table mae_publicacion (
  id           uuid        primary key default gen_random_uuid(),
  autor_id     uuid        not null references mae_usuario(id),
  zona_id      uuid        not null references mae_zona(id),
  modulo       modulo_publicacion not null,
  tipo         tipo_publicacion   not null,
  categoria_id integer     not null references def_categoria(id),   -- ambito segun modulo (lo valida el servicio)
  titulo       varchar(160) not null check (char_length(trim(titulo)) >= 3),
  descripcion  text        not null check (char_length(descripcion) <= 4000),
  ubicacion    geography(Point,4326),   -- ECONOMIA: punto exacto del servicio (RF19); SOLIDARIDAD: aproximada
  estado       estado_publicacion not null default 'ACTIVA',
  expira_en    timestamptz,
  version      bigint      not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,                                        -- baja logica (RF14)
  constraint ck_publicacion_modulo_tipo check (
    (modulo = 'ECONOMIA'    and tipo = 'SERVICIO') or
    (modulo = 'SOLIDARIDAD' and tipo <> 'SERVICIO')),
  constraint ck_servicio_con_ubicacion check (modulo <> 'ECONOMIA' or ubicacion is not null)
);

-- ============================ 6. ECONOMIA LOCAL =============================
-- Detalle 1:1 de una publicacion tipo SERVICIO (RF11, RF13, RF17, RF20, RF45).
create table det_servicio (
  publicacion_id      uuid          primary key references mae_publicacion(id) on delete cascade,
  nombre_comercial    varchar(120)  not null,
  marca               varchar(80),                                   -- RF17
  telefono_contacto   varchar(9)    check (telefono_contacto is null or telefono_contacto ~ '^[0-9]{9}$'),
  direccion_texto     varchar(255),
  horario             jsonb,
  precio_desde        numeric(10,2) check (precio_desde is null or precio_desde >= 0),   -- RF13
  tarifa_detalle      varchar(300),
  moneda              char(3)       not null default 'PEN',
  promedio_valoracion numeric(3,2)  not null default 0 check (promedio_valoracion between 0 and 5),
  total_valoraciones  integer       not null default 0 check (total_valoraciones >= 0)
);

-- Valoracion + resena (RF41, RF42). Reglas RF43/RF44 por trigger en la seccion 10.
create table det_valoracion (
  id          uuid        primary key default gen_random_uuid(),
  servicio_id uuid        not null references det_servicio(publicacion_id) on delete cascade,
  autor_id    uuid        not null references mae_usuario(id),
  puntuacion  smallint    not null check (puntuacion between 1 and 5),
  comentario  varchar(1000),
  oculta      boolean     not null default false,        -- moderacion
  version     bigint      not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (servicio_id, autor_id)                          -- una valoracion por vecino y servicio
);

-- ============================ 7. SOLIDARIDAD ================================
-- Detalle 1:1 de publicaciones de SOLIDARIDAD (RF21 a RF26). Columnas nulas segun el tipo.
create table det_solidaridad (
  publicacion_id            uuid primary key references mae_publicacion(id) on delete cascade,
  justificacion             varchar(1000),               -- RF21 (SOLICITUD_AYUDA)
  cantidad                  integer check (cantidad is null or cantidad > 0),      -- RF23 stock
  marca                     varchar(80),                 -- RF23
  condiciones_uso           varchar(500),                -- RF23
  fotos_rutas               text[] not null default '{}',   -- RF24 (rutas en Supabase Storage, bucket privado)
  origen_texto              varchar(200),                -- RF26
  destino_texto             varchar(200),                -- RF26
  fecha_salida              timestamptz,                 -- RF26
  asientos                  smallint check (asientos is null or asientos between 1 and 20),  -- RF26
  fecha_necesaria           date,
  fecha_devolucion_prevista date,
  interaccion_aceptada_id   uuid,                        -- FK se agrega abajo (tabla aun no existe)
  constraint ck_solidaridad_fotos   check (cardinality(fotos_rutas) <= 5),
  constraint ck_solidaridad_fechas  check (fecha_devolucion_prevista is null or fecha_necesaria is null
                                           or fecha_devolucion_prevista >= fecha_necesaria)
);

-- Postulaciones / ofrecimientos / "quiero ayudar" (RF22, RF30).
create table det_interaccion_publicacion (
  id             uuid        primary key default gen_random_uuid(),
  publicacion_id uuid        not null references mae_publicacion(id) on delete cascade,
  usuario_id     uuid        not null references mae_usuario(id),
  estado         estado_interaccion not null default 'PENDIENTE',
  mensaje        varchar(1000),
  version        bigint      not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index uq_interaccion_viva
  on det_interaccion_publicacion (publicacion_id, usuario_id)
  where estado in ('PENDIENTE','ACEPTADA');

-- Una sola interaccion ganadora por publicacion (UPDATE condicional ... WHERE interaccion_aceptada_id IS NULL).
alter table det_solidaridad
  add constraint fk_solidaridad_interaccion_aceptada
  foreign key (interaccion_aceptada_id) references det_interaccion_publicacion(id),
  add constraint uq_solidaridad_interaccion_aceptada unique (interaccion_aceptada_id);

-- ============================ 8. EMERGENCIAS ================================
-- Alerta o necesidad critica (RF31, RF32, RF34, RF38, RF39). Sin datos personales: eso va en det_reporte_datos_sensibles.
create table mae_reporte_humanitario (
  id                    uuid        primary key default gen_random_uuid(),
  tipo                  tipo_reporte not null,
  reportante_id         uuid        not null references mae_usuario(id),
  zona_id               uuid        not null references mae_zona(id),
  categoria_id          integer     not null references def_categoria(id),   -- ambito NECESIDAD (lo valida el servicio)
  descripcion_necesidad varchar(1000) not null,                              -- SIN nombres/direcciones/telefonos
  numero_personas       smallint    check (numero_personas is null or numero_personas > 0),
  ubicacion_aprox       geography(Point,4326) not null,                      -- lo unico visible en el dashboard publico (RF35)
  prioridad             prioridad_emergencia not null default 'MEDIA',       -- calculada por el backend (RF34)
  estado                estado_reporte       not null default 'ABIERTA',     -- RF38
  es_anonimo            boolean     not null default false,
  responsable_id        uuid        references mae_usuario(id),
  motivo_cierre         varchar(500),
  cerrado_en            timestamptz,
  cerrado_por_id        uuid        references mae_usuario(id),              -- RF39: admin o el propio reportante
  version               bigint      not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint ck_reporte_cierre check (
    (estado in ('ATENDIDA','DESCARTADA')     and cerrado_en is not null and cerrado_por_id is not null) or
    (estado not in ('ATENDIDA','DESCARTADA') and cerrado_en is null))
);

-- Datos identificables y ubicacion EXACTA (RF32, RF33). Solo admin via backend.
create table det_reporte_datos_sensibles (
  reporte_id             uuid primary key references mae_reporte_humanitario(id) on delete cascade,
  ubicacion_exacta       geography(Point,4326) not null,        -- RF33: obligatoria
  direccion_texto        varchar(255),
  nombre_persona         varchar(120),
  contacto               varchar(60),
  detalle_vulnerabilidad text
);

-- Inventario de almacenes comunales (RF36).
create table mae_recurso (
  id                  uuid        primary key default gen_random_uuid(),
  zona_id             uuid        not null references mae_zona(id),
  categoria_id        integer     not null references def_categoria(id),   -- ambito RECURSO (lo valida el servicio)
  descripcion         varchar(300) not null,
  unidad              varchar(30) not null default 'unidad',
  cantidad_total      integer     not null check (cantidad_total >= 0),
  cantidad_disponible integer     not null check (cantidad_disponible >= 0),
  almacen_texto       varchar(255) not null,
  activo              boolean     not null default true,
  version             bigint      not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint ck_recurso_stock check (cantidad_disponible <= cantidad_total)
);

-- Asignacion de recursos a emergencias abiertas (RF37).
-- Descuento atomico: UPDATE mae_recurso SET cantidad_disponible = cantidad_disponible - :n
--                    WHERE id = :r AND cantidad_disponible >= :n   (0 filas = sin stock)
create table det_asignacion_recurso (
  id           uuid        primary key default gen_random_uuid(),
  reporte_id   uuid        not null references mae_reporte_humanitario(id),
  recurso_id   uuid        not null references mae_recurso(id),
  cantidad     integer     not null check (cantidad > 0),
  estado       estado_asignacion not null default 'RESERVADA',
  asignado_por uuid        not null references mae_usuario(id),
  version      bigint      not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index uq_asignacion_viva
  on det_asignacion_recurso (reporte_id, recurso_id) where estado <> 'CANCELADA';

-- ============================ 9. TRANSVERSALES ==============================
-- Bitacora de estados. INALTERABLE (RF40): solo INSERT (trigger en seccion 10).
create table det_historial_estado (
  id              bigint generated always as identity primary key,
  entidad_tipo    varchar(30) not null check (entidad_tipo in
                    ('PUBLICACION','INTERACCION','REPORTE','ASIGNACION','DENUNCIA')),
  entidad_id      uuid        not null,
  estado_anterior varchar(30),
  estado_nuevo    varchar(30) not null,
  actor_id        uuid        references mae_usuario(id),
  motivo          varchar(500),
  created_at      timestamptz not null default now()
);

-- Denuncias y moderacion (RF46, RF47).
create table det_denuncia (
  id                   uuid        primary key default gen_random_uuid(),
  denunciante_id       uuid        not null references mae_usuario(id),
  publicacion_id       uuid        references mae_publicacion(id) on delete cascade,
  usuario_denunciado_id uuid       references mae_usuario(id),
  motivo               varchar(500) not null,
  estado               estado_denuncia not null default 'PENDIENTE',
  accion               accion_moderacion,
  justificacion_admin  varchar(1000),
  resuelta_por_id      uuid        references mae_usuario(id),
  resuelta_en          timestamptz,
  created_at           timestamptz not null default now(),
  constraint ck_denuncia_objetivo check (num_nonnulls(publicacion_id, usuario_denunciado_id) = 1),
  constraint ck_denuncia_resolucion check (                              -- RF47: justificacion obligatoria
    estado = 'PENDIENTE' or
    (resuelta_por_id is not null and resuelta_en is not null and accion is not null
     and char_length(trim(coalesce(justificacion_admin, ''))) >= 10))
);
create unique index uq_denuncia_pendiente
  on det_denuncia (denunciante_id, publicacion_id) where estado = 'PENDIENTE' and publicacion_id is not null;

-- Notificaciones (RF48). El texto NUNCA lleva datos sensibles.
create table det_notificacion (
  id              uuid        primary key default gen_random_uuid(),
  usuario_id      uuid        not null references mae_usuario(id) on delete cascade,
  tipo            tipo_notificacion not null,
  titulo          varchar(120) not null,
  cuerpo          varchar(300),
  entidad_tipo    varchar(30),
  entidad_id      uuid,
  leida_en        timestamptz,
  push_enviada_en timestamptz,
  created_at      timestamptz not null default now()
);

create table det_suscripcion_push (
  id              uuid        primary key default gen_random_uuid(),
  usuario_id      uuid        not null references mae_usuario(id) on delete cascade,
  endpoint        text        not null unique,
  p256dh          varchar(255) not null,
  auth            varchar(255) not null,
  user_agent      varchar(255),
  activa          boolean     not null default true,
  ultimo_error_en timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================ 10. INDICES ===================================
-- Geoespaciales
create index ix_zona_limite           on mae_zona using gist (limite);
create index ix_zona_centro           on mae_zona using gist (centro);
create index ix_publicacion_ubicacion on mae_publicacion using gist (ubicacion) where deleted_at is null;
create index ix_reporte_ubicacion     on mae_reporte_humanitario using gist (ubicacion_aprox);

-- Busqueda y feed
create index ix_publicacion_feed        on mae_publicacion (zona_id, modulo, estado, created_at desc) where deleted_at is null;
create index ix_publicacion_categoria   on mae_publicacion (categoria_id) where deleted_at is null;
create index ix_publicacion_autor       on mae_publicacion (autor_id, created_at desc);
create index ix_publicacion_titulo_trgm on mae_publicacion using gin (titulo gin_trgm_ops);
create index ix_servicio_nombre_trgm    on det_servicio using gin (nombre_comercial gin_trgm_ops);
create index ix_servicio_marca_trgm     on det_servicio using gin (marca gin_trgm_ops);
create index ix_servicio_reputacion     on det_servicio (promedio_valoracion desc);
create index ix_categoria_padre         on def_categoria (padre_id);

-- FKs frecuentes
create index ix_usuario_zona           on mae_usuario (zona_id) where deleted_at is null;
create index ix_usuario_rol            on mae_usuario (rol_id);
create index ix_interaccion_publicacion on det_interaccion_publicacion (publicacion_id, estado);
create index ix_interaccion_usuario    on det_interaccion_publicacion (usuario_id, created_at desc);   -- RF28 historial
create index ix_valoracion_servicio    on det_valoracion (servicio_id, created_at desc) where deleted_at is null and not oculta;
create index ix_valoracion_autor       on det_valoracion (autor_id);
create index ix_reporte_cola           on mae_reporte_humanitario (zona_id, estado, prioridad, created_at)
                                         where estado in ('ABIERTA','EN_ATENCION');
create index ix_reporte_reportante     on mae_reporte_humanitario (reportante_id, created_at desc);
create index ix_reporte_responsable    on mae_reporte_humanitario (responsable_id) where responsable_id is not null;
create index ix_recurso_zona           on mae_recurso (zona_id, categoria_id) where activo;
create index ix_asignacion_recurso     on det_asignacion_recurso (recurso_id);
create index ix_asignacion_reporte     on det_asignacion_recurso (reporte_id);
create index ix_denuncia_pendientes    on det_denuncia (created_at) where estado = 'PENDIENTE';
create index ix_denuncia_publicacion   on det_denuncia (publicacion_id) where publicacion_id is not null;
create index ix_notificacion_usuario   on det_notificacion (usuario_id, created_at desc);
create index ix_notificacion_no_leidas on det_notificacion (usuario_id) where leida_en is null;
create index ix_push_usuario           on det_suscripcion_push (usuario_id) where activa;
create index ix_historial_entidad      on det_historial_estado (entidad_tipo, entidad_id, created_at);
create index ix_contacto_zona          on def_contacto_soporte (zona_id, orden) where activo;

-- ============================ 11. TRIGGERS ==================================
-- 11.1 updated_at (NO se toca 'version': lo gestiona Hibernate con @Version)
create or replace function fn_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'mae_zona','mae_usuario','mae_publicacion','det_interaccion_publicacion','det_valoracion',
    'mae_reporte_humanitario','mae_recurso','det_asignacion_recurso'
  ] loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on %1$I for each row execute function fn_set_updated_at()', t);
  end loop;
end $$;

-- 11.2 Reputacion: promedio y total por servicio (RF45)
create or replace function fn_recalcular_reputacion(p_servicio uuid) returns void
language plpgsql as $$
begin
  update det_servicio s set
    promedio_valoracion = coalesce((select round(avg(v.puntuacion)::numeric, 2) from det_valoracion v
                                    where v.servicio_id = p_servicio and v.deleted_at is null and not v.oculta), 0),
    total_valoraciones  = (select count(*) from det_valoracion v
                           where v.servicio_id = p_servicio and v.deleted_at is null and not v.oculta)
  where s.publicacion_id = p_servicio;
end $$;

create or replace function fn_trg_reputacion() returns trigger
language plpgsql as $$
begin
  perform fn_recalcular_reputacion(coalesce(new.servicio_id, old.servicio_id));
  return null;
end $$;

create trigger trg_valoracion_reputacion
  after insert or update or delete on det_valoracion
  for each row execute function fn_trg_reputacion();

-- 11.3 Valoracion: no a si mismo (RF44) y misma zona (RF43)
create or replace function fn_validar_valoracion() returns trigger
language plpgsql as $$
declare
  v_autor_pub uuid;
  v_zona_pub  uuid;
  v_zona_usr  uuid;
begin
  select p.autor_id, p.zona_id into v_autor_pub, v_zona_pub
    from mae_publicacion p where p.id = new.servicio_id;
  select u.zona_id into v_zona_usr
    from mae_usuario u where u.id = new.autor_id;

  if v_autor_pub = new.autor_id then
    raise exception 'No se permite valorar el propio servicio' using errcode = '23514';
  end if;
  if v_zona_usr is null or v_zona_usr <> v_zona_pub then
    raise exception 'Solo vecinos de la misma zona pueden valorar este servicio' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger trg_valoracion_validar before insert on det_valoracion
  for each row execute function fn_validar_valoracion();

-- 11.4 Nadie postula a su propia publicacion
create or replace function fn_validar_interaccion() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from mae_publicacion p where p.id = new.publicacion_id and p.autor_id = new.usuario_id) then
    raise exception 'No puedes responder a tu propia publicación' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger trg_interaccion_validar before insert on det_interaccion_publicacion
  for each row execute function fn_validar_interaccion();

-- 11.5 Historial inalterable (RF40): bloquea UPDATE, DELETE y TRUNCATE
create or replace function fn_historial_inmutable() returns trigger
language plpgsql as $$
begin
  raise exception 'det_historial_estado es de solo inserción' using errcode = '42501';
end $$;

create trigger trg_historial_no_modificar before update or delete on det_historial_estado
  for each row execute function fn_historial_inmutable();
create trigger trg_historial_no_truncar before truncate on det_historial_estado
  for each statement execute function fn_historial_inmutable();

-- ============================ 12. ACCESO: RLS + REVOCACIONES ================
-- Spring Boot es el UNICO que lee/escribe datos de negocio. Se cierra la Data API de Supabase:
--   * RLS activado en todas las tablas y SIN politicas para anon/authenticated => denegado.
--   * Ademas se revocan privilegios (defensa en profundidad).
-- El backend debe conectarse con un rol duenio de las tablas (p. ej. postgres) o con BYPASSRLS.
do $$
declare t text;
begin
  foreach t in array array[
    'def_rol','def_categoria','def_contacto_soporte','mae_zona','mae_usuario','mae_publicacion',
    'mae_reporte_humanitario','mae_recurso','det_servicio','det_valoracion','det_solidaridad',
    'det_interaccion_publicacion','det_reporte_datos_sensibles','det_asignacion_recurso',
    'det_historial_estado','det_denuncia','det_notificacion','det_suscripcion_push'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke all on table %I from anon, authenticated', t);
  end loop;
end $$;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
