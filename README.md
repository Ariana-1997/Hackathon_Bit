# RedVecinal – Backend

API REST de la PWA comunitaria: servicios de proximidad, cadena de favores y coordinación de emergencias.
**Spring Boot 3.5 · Java 21 · Supabase (PostgreSQL + PostGIS) · React (frontend aparte)**

## Arranque rápido

1. Requisitos: JDK 21, Maven 3.9+, (Docker para pruebas de integración).
2. Copia `.env.example` → `.env` y completa los datos de tu proyecto Supabase.
3. Carga datos mínimos: `docs/sql/datos_iniciales.sql` en el SQL Editor de Supabase.
4. Ejecuta:
   ```bash
   mvn spring-boot:run
   ```
5. Abre Swagger: http://localhost:8080/swagger-ui.html

## Documentación

- API: Swagger UI en `/swagger-ui.html` (contrato OpenAPI en `/v3/api-docs`).
- Esquema de BD: migraciones Flyway en [src/main/resources/db/migration](src/main/resources/db/migration).
- Datos de arranque: [docs/sql/datos_iniciales.sql](docs/sql/datos_iniciales.sql).
- Prueba de carga: [docs/carga/k6-catalogo.js](docs/carga/k6-catalogo.js).

## Permisos y moderación

- No hay roles: fuera de los endpoints públicos basta con estar autenticado; solo el autor modifica lo suyo.
- Moderación comunitaria: una publicación que acumula `DENUNCIAS_PARA_OCULTAR` denuncias pendientes
  (por defecto 3, de vecinos distintos) pasa a `MODERADA`, deja de ser visible para los demás y se avisa al autor.

## Estructura

```
pe.redvecinal
├── shared/          config, seguridad (JWT Supabase), errores, paginación, geo, bitácora, clientes Supabase
├── usuarios/        Módulo 1: acceso, perfil, zonas
├── catalogo/        categorías jerárquicas y directorio de soporte
├── publicaciones/   base común de servicios y solidaridad
├── servicios/       Módulo 2: economía local
├── reputacion/      Módulo 5: valoraciones
├── solidaridad/     Módulo 3: cadena de favores
├── archivos/        fotos (Supabase Storage, URLs firmadas)
├── emergencias/     Módulo 4: alertas y dashboard en tiempo real (SSE)
├── moderacion/      Módulo 5: denuncias y ocultamiento automático
└── notificaciones/  Módulo 5: bandeja y push
```

## Comandos

| Comando | Qué hace |
|---|---|
| `mvn test` | Pruebas unitarias e integración (Testcontainers) |
| `mvn package` | Genera `target/redvecinal-backend-*.jar` |
| `docker build -t redvecinal-backend .` | Imagen para despliegue |
