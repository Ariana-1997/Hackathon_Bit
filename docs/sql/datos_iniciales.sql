-- =====================================================================
-- Datos mínimos para empezar a probar (ejecutar en el SQL Editor de Supabase).
-- NO es una migración: ajusta nombres y coordenadas a tu comunidad.
-- =====================================================================

-- 1) Zona por centro + radio (RF10). Coordenadas: ST_MakePoint(LONGITUD, LATITUD)
insert into mae_zona (codigo, nombre, centro, radio_m)
values ('ZONA-01', 'Mi barrio (piloto)',
        ST_SetSRID(ST_MakePoint(-77.0428, -12.0464), 4326)::geography, 3000)
on conflict (codigo) do nothing;

-- 2) Bucket privado para fotos (RF24)
insert into storage.buckets (id, name, public)
values ('publicaciones', 'publicaciones', false)
on conflict (id) do nothing;

-- 3) Contactos de soporte visibles en todas las zonas (RF50)
insert into def_contacto_soporte (nombre, descripcion, telefono, orden) values
  ('Emergencias', 'Central de emergencias', '105', 1),
  ('Bomberos', 'Cuerpo de bomberos', '116', 2);

-- 4) Convertir un usuario ya registrado en administrador (rol_id = 3)
-- update mae_usuario set rol_id = 3
-- where auth_user_id = (select id from auth.users where email = 'admin@tu-dominio.pe');
