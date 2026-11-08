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

- [Guía paso a paso](docs/GUIA_PASO_A_PASO.md): decisiones, estructura, seguridad, orden de implementación, offline, despliegue.
- [Matriz de trazabilidad](docs/TRAZABILIDAD.md): cada RF/RNF con su endpoint, clase y tabla.

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
├── emergencias/     Módulo 4: alertas, recursos, dashboard en tiempo real (SSE)
├── moderacion/      Módulo 5: denuncias y moderación
└── notificaciones/  Módulo 5: bandeja y push
```

## Comandos

| Comando | Qué hace |
|---|---|
| `mvn test` | Pruebas unitarias e integración (Testcontainers) |
| `mvn package` | Genera `target/redvecinal-backend-*.jar` |
| `docker build -t redvecinal-backend .` | Imagen para despliegue |
