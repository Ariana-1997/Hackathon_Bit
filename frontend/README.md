# RedVecinal – Frontend

Aplicación React + Vite para RedVecinal.

## Arquitectura de datos

El navegador se comunica exclusivamente con la API REST de **Spring Boot** mediante `/api/v1`.
Spring Boot es el único componente que accede a PostgreSQL/Supabase y a Supabase Auth/Storage usando credenciales privadas del backend.

- Frontend React: interfaz y caché local no sensible.
- Backend Spring Boot: autenticación, validaciones, permisos y operaciones de negocio.
- PostgreSQL/Supabase: persistencia; solo el backend mantiene credenciales privadas.
- `server.js`: sirve los archivos estáticos y reenvía únicamente `/api/v1`, `/actuator` y documentación Swagger a Spring Boot. No guarda usuarios ni publicaciones y no se conecta a Supabase.
- No se deben crear variables `VITE_SUPABASE_*` ni copiar `SUPABASE_SERVICE_ROLE_KEY` al frontend.

## Requisitos

- Node.js 20 o superior.
- Backend Spring Boot iniciado en `http://localhost:8080`.
- Configuración de Supabase únicamente en `backend/.env` o en las variables privadas del entorno donde se despliegue Spring Boot.

## Desarrollo local

1. En `frontend`, copia `.env.example` a `.env`.
2. Confirma que `VITE_BACKEND_URL=http://localhost:8080`.
3. Instala dependencias y arranca Vite:

   ```bash
   npm install
   npm run dev
   ```

4. Abre `http://localhost:3000`.

Vite reenvía `/api/v1` al backend configurado en `VITE_BACKEND_URL`.

## Producción

1. Construye el frontend:

   ```bash
   npm install
   npm run build
   ```

2. Configura `BACKEND_URL` con la URL HTTPS pública del backend Spring Boot.
3. Inicia el servidor estático/proxy:

   ```bash
   npm start
   ```

El frontend debe publicarse con HTTPS y el backend debe tener `CORS_ORIGINS` limitado al dominio real del frontend.

## Seguridad

- Nunca subir `.env`, contraseñas, tokens ni claves privadas.
- `SUPABASE_SERVICE_ROLE_KEY` solo se configura en el backend.
- El inicio de sesión, registro y recuperación se validan mediante endpoints de Spring Boot.
- `localStorage` se limita a preferencias/caché; no es fuente de autenticación ni almacena contraseñas o respuestas de seguridad.
- Si una operación no se confirma desde Spring Boot, la interfaz no debe presentarla como guardada en la nube.
