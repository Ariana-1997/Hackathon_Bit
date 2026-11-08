# 🤝 Entre Vecinos - Red Barrial Hiperlocal (PWA)

> **Plataforma web comunitaria para conectar oficios de confianza, solidaridad vecinal y auxilio ante emergencias.**  
> Diseñada para el distrito de **Pachacamac (Lima, Perú)** con arquitectura **Offline-First**, publicación rápida en **3 clics**, enlace directo a **WhatsApp personal** y sincronización en la nube con **Spring Boot 3 + Supabase PostgreSQL**.

---

## 🌟 Funcionalidades Principales

### 1. 💼 Economía Local & Oficios de Cuadra
* **Directorio Hiperlocal (<300m):** Encuentra gasfiteros, electricistas, cerrajeros y técnicos en tu propia manzana o cuadra.
* **Contacto Directo por WhatsApp:** Al hacer clic en *"Contactar por WhatsApp"*, se abre directamente el chat con el número registrado del vecino (`wa.me/51...`) con un mensaje precargado.
* **Visto Bueno Vecinal:** Calificación social comunitaria respaldada por vecinos reales de la zona.

### 2. 🛡️ Autenticación y Seguridad a Costo Cero
* **Registro e Inicio de Sesión por Correo y Contraseña:** Validación estricta sin costos de SMS ni APIs pagadas.
* **Selector de Ubicación Estilo inDrive:** Mapa interactivo con pin arrastrable para fijar las coordenadas exactas de la vivienda.
* **Cuentas Demo para el Jurado:** Botones de acceso rápido en 1 toque para probar los perfiles del jurado (*Renato Solis*, *Yummy Untiveros*, *Carlos Mendoza*).

### 3. 🤝 Cadena de Favores Solidarios
* Préstamo de herramientas (taladros, escaleras, podadoras).
* Ayuda comunitaria en compras o asistencia a adultos mayores a costo S/ 0.

### 4. 🚨 Modo Emergencia & Red de Auxilio SOS
* **Metamorfosis Visual Inmediata:** La interfaz cambia a modo alerta con un solo toque ante emergencias vecinales o cortes de suministros.
* **Red de Voluntarios SOS:** Vecinos con oficios críticos listos para apoyar ante crisis.
* **Directorio Rápido:** Acceso directo a números de emergencia (Policía 105, Bomberos 116, Serenazgo).

### 5. 📡 Resiliencia Offline (PWA)
* **Arquitectura Offline-First:** La aplicación sigue abriendo y funcionando aun cuando no haya conexión a internet en la zona.
* **Service Worker con Auto-Sincronización:** Guarda publicaciones en cola local y las sincroniza en cuanto recupera señal.

---

## 🚀 Arquitectura Tecnológica

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet (Mapas), PWA (Service Worker) |
| **Backend en la Nube** | Spring Boot 3 (Java 21) desplegado en **Render** |
| **Base de Datos Cloud** | **PostgreSQL** con extensiones espaciales **PostGIS** en **Supabase** (`mae_usuario`, `mae_publicacion`) |
| **Servidor Local & Bridge** | Node.js Server con Reverse Proxy + Base de Datos de Respaldo JSON |
| **Túnel Seguro PWA** | Cloudflare Tunnel (HTTPS) para acceso móvil |

---

## 💻 Instalación y Ejecución

### Prerrequisitos
* Node.js v18 o superior.
* Gestor de paquetes `npm`.

### 1. Entrar a la carpeta del Frontend
```bash
cd frontend
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Variables de Entorno
Copia el archivo de ejemplo:
```bash
copy .env.example .env
```

### 4. Modo Desarrollo
```bash
npm run dev
```

### 5. Compilación y Servidor de Producción con Sincronización
```bash
# Compilar paquete optimizado para producción
npm run build

# Iniciar el servidor local con proxy a Supabase / Render
node server.js
```
El servidor estará activo en `http://localhost:3000`.

---

## 👥 Equipo - Hackathon BIT
* Proyecto desarrollado para la inclusión digital, reactivación económica barrial y seguridad ciudadana.
