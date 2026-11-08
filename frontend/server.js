import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const FEED_FILE = path.join(DATA_DIR, 'community_feed.json');
const USERS_FILE = path.join(DATA_DIR, 'registered_users.json');
const PORT = 3000;

// Configuración dinámica del backend del equipo (Spring Boot - por defecto http://localhost:8080)
const BACKEND_URL_RAW = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:8080';
let backendParsed;
try {
  backendParsed = new URL(BACKEND_URL_RAW.startsWith('http') ? BACKEND_URL_RAW : `http://${BACKEND_URL_RAW}`);
} catch {
  backendParsed = new URL('http://localhost:8080');
}
const BACKEND_PROTOCOL = backendParsed.protocol === 'https:' ? https : http;
const BACKEND_HOST = backendParsed.hostname;
const BACKEND_PORT = backendParsed.port ? parseInt(backendParsed.port, 10) : (backendParsed.protocol === 'https:' ? 443 : 80);

// Configuración de Supabase Cloud Oficial (Proyecto Hackathon-Bit)
const SUPABASE_HOST = process.env.SUPABASE_HOST || 'jphuvrsupoelyyxaifby.supabase.co';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEFAULT_ZONA_ID = process.env.DEFAULT_ZONA_ID || '5a064c5e-ac87-4f54-bebb-a0d8f7034b50';

async function supabaseRequest(endpoint, method = 'GET', body = null) {
  try {
    const res = await fetch(`https://${SUPABASE_HOST}${endpoint}`, {
      method,
      headers: {
        'apikey': SUPABASE_SECRET,
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.warn('[Supabase Direct REST Error]:', err.message);
    return { ok: false, error: err.message };
  }
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FEED_FILE)) {
  fs.writeFileSync(FEED_FILE, JSON.stringify({ services: [], favors: [], emergencies: [] }, null, 2));
}

const SEED_USERS = [
  { id: 'usr_carlos_mendoza', name: 'Carlos Mendoza', email: 'carlos.mendoza@barrio.pe', phone: '987654321', password: 'Password123!', block: 'Manzana B', address: 'Calle Los Álamos 142', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_yummy_untiveros', name: 'Yummy Untiveros', email: 'yummy@barrio.pe', phone: '933613514', password: 'Password123!', block: 'Manzana C', address: 'La Casica - Pachacamac', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_dona_rosa', name: 'Doña Rosa Quispe', email: 'dona.rosa@barrio.pe', phone: '911222333', password: 'Password123!', block: 'Manzana A', address: 'Pasaje San Martín 12', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_pedro_castillo', name: 'Pedro Castillo', email: 'pedro.castillo@barrio.pe', phone: '955443322', password: 'Password123!', block: 'Manzana D', address: 'Sector 3', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_jean', name: 'Jean', email: 'jean@barrio.pe', phone: '902322768', password: 'Password123!', block: 'Manzana C', address: 'Pachacamac', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_sofia', name: 'Sofía Valdivia', email: 'sofia@barrio.pe', phone: '933445566', password: 'Password123!', block: 'Calle Los Pinos 110', address: 'Calle Los Pinos 110', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_lucia_fernandez', name: 'Lucia Fernandez', email: 'lucia.fernandez@barrio.pe', phone: '976543210', password: 'Password123!', block: 'Manzana B', address: 'Av. Pachacamac 45', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_961024198', name: 'Renato Solis', email: 'renato@barrio.pe', phone: '961024198', password: 'Password123!', block: 'Manzana C', address: 'La Casica, Mz C - Pachacamac', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
  { id: 'usr_933613515', name: 'Sandra', email: 'sandra@barrio.pe', phone: '933613515', password: 'Password123!', block: 'Manzana C', address: 'Pachacamac', securityQuestions: { q1: 'boby', q2: 'ceviche', q3: 'san martin' } },
];

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(SEED_USERS, null, 2));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Función para reenviar peticiones hacia el backend Spring Boot del equipo
function proxyToBackend(req, res) {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${BACKEND_HOST}:${BACKEND_PORT}`,
    },
  };

  const proxyReq = BACKEND_PROTOCOL.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*',
    });
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.warn(`[Proxy Fallback]: Backend no conectado en ${BACKEND_HOST}:${BACKEND_PORT} (${err.message})`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend no conectado', detail: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

// Registrar o asegurar usuario directamente en Supabase mae_usuario
async function bridgeUserToSupabase(user) {
  try {
    const authorName = user.name || 'Vecino';
    const rawPhone = user.phone || '999999999';
    const authorPhone = rawPhone.replace(/\D/g, '').slice(-9).padStart(9, '9');

    // 1. Verificar si ya existe en mae_usuario
    const existing = await supabaseRequest(`/rest/v1/mae_usuario?telefono=eq.${authorPhone}&select=id,nombre,telefono`);
    if (existing.ok && Array.isArray(existing.data) && existing.data.length > 0) {
      console.log(`[Supabase Cloud] ✅ Usuario existente en mae_usuario: "${existing.data[0].nombre}" (ID: ${existing.data[0].id})`);
      return existing.data[0].id;
    }

    // 2. Crear credenciales en Supabase Auth con email_confirm=true (sin enviar correos molestos)
    const cleanEmail = (user.email || `vecino_${authorPhone}@barrio.pe`).trim().toLowerCase();
    const adminUserRes = await supabaseRequest('/auth/v1/admin/users', 'POST', {
      email: cleanEmail,
      password: user.password || 'Password123!',
      email_confirm: true,
      user_metadata: { name: authorName, phone: authorPhone }
    });

    let authUserId = adminUserRes.data?.id;
    if (!authUserId) {
      const existingAuth = await supabaseRequest('/auth/v1/admin/users');
      if (existingAuth.ok && Array.isArray(existingAuth.data?.users)) {
        const found = existingAuth.data.users.find(u => u.email === cleanEmail);
        if (found) authUserId = found.id;
      }
    }
    if (!authUserId) {
      authUserId = '8e767002-bc2f-4115-98e3-d8fd270df311';
    }

    // 3. Insertar nuevo usuario en mae_usuario con el auth_user_id real
    const newUserId = crypto.randomUUID();
    const insertRes = await supabaseRequest('/rest/v1/mae_usuario', 'POST', {
      id: newUserId,
      auth_user_id: authUserId,
      nombre: authorName,
      telefono: authorPhone,
      zona_id: DEFAULT_ZONA_ID,
      ubicacion: `POINT(${user.lng || -77.0428} ${user.lat || -12.0464})`,
      estado: 'ACTIVO',
      version: 0,
    });

    if (insertRes.ok) {
      console.log(`[Supabase Cloud] 🎉 Nuevo vecino guardado en mae_usuario: "${authorName}" (ID: ${newUserId}, Tel: ${authorPhone})`);
      return newUserId;
    } else {
      console.warn('[Supabase Cloud Insert Warning]:', insertRes.status, insertRes.data);
    }
  } catch (err) {
    console.warn('[Supabase Cloud User Bridge Error]:', err.message);
  }
}

// Puente automático para guardar publicaciones y detalles en Supabase mae_publicacion y det_servicio
async function bridgeToSupabase(item) {
  try {
    const authorName = item.author?.name || 'Vecino';
    const rawPhone = item.author?.phone || '999999999';
    const authorPhone = rawPhone.replace(/\D/g, '').slice(-9).padStart(9, '9');

    // 1. Obtener o crear el autor en mae_usuario
    let authorId = await bridgeUserToSupabase({ name: authorName, phone: authorPhone, address: item.author?.address || item.address });
    if (!authorId) {
      authorId = 'bf048b95-afbb-4f89-ab34-58a860e3a7a0';
    }

    // Mapeo de categorías
    const catMap = {
      plomeria: 29, gasfiteria: 29, electricidad: 30, carpinteria: 31,
      albanileria: 32, pintura: 33, jardineria: 34, limpieza: 35,
      mecanica: 36, belleza: 37, comidas: 40, otros: 7,
      herramientas: 9, materiales: 10, habilidades: 11, transporte: 12, ayuda: 8
    };
    const catKey = (item.category || '').toLowerCase();
    const categoriaId = catMap[catKey] || 7;

    const pubId = crypto.randomUUID();
    const lat = item.lat || -12.0464;
    const lng = item.lng || -77.0428;

    const isFavor = item.type === 'FAVOR';
    const pubPayload = {
      id: pubId,
      autor_id: authorId,
      zona_id: DEFAULT_ZONA_ID,
      modulo: isFavor ? 'SOLIDARIDAD' : 'ECONOMIA',
      tipo: isFavor ? 'SOLICITUD_AYUDA' : 'SERVICIO',
      categoria_id: isFavor ? (catMap[catKey] || 8) : categoriaId,
      titulo: item.title,
      descripcion: item.description || 'Publicado mediante la Red Barrial Entre Vecinos.',
      ubicacion: `POINT(${lng} ${lat})`,
      estado: 'ACTIVA',
      version: 0,
    };

    const pubRes = await supabaseRequest('/rest/v1/mae_publicacion', 'POST', pubPayload);

    if (pubRes.ok) {
      console.log(`[Supabase Cloud Bridge] ✅ Guardado en mae_publicacion: "${item.title}" (ID: ${pubId})`);

      if (!isFavor) {
        // Insertar en det_servicio con teléfono WhatsApp y dirección exacta
        const srvRes = await supabaseRequest('/rest/v1/det_servicio', 'POST', {
          publicacion_id: pubId,
          nombre_comercial: item.title,
          telefono_contacto: authorPhone,
          direccion_texto: item.address || item.author?.address || item.author?.block || 'Pachacamac, Lima',
          moneda: 'PEN',
          precio_desde: 15.0,
          tarifa_detalle: item.priceNote || 'A coordinar por WhatsApp',
          promedio_valoracion: 5.0,
          total_valoraciones: 1,
        });
        if (srvRes.ok) {
          console.log(`[Supabase Cloud Bridge] ✅ Detalle de servicio guardado en det_servicio para: "${item.title}"`);
        }
      } else {
        // Insertar en det_solidaridad
        const solRes = await supabaseRequest('/rest/v1/det_solidaridad', 'POST', {
          publicacion_id: pubId,
          fotos_rutas: [],
        });
        if (solRes.ok) {
          console.log(`[Supabase Cloud Bridge] ✅ Detalle solidario guardado en det_solidaridad para: "${item.title}"`);
        }
      }
    } else {
      console.warn('[Supabase Cloud Pub Warning]:', pubRes.status, pubRes.data);
    }
  } catch (err) {
    console.warn('[Supabase Direct Bridge Exception]:', err.message);
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Verificar si un usuario está registrado en la base de datos (por email o celular)
  if (req.url.startsWith('/api/sync/check-user') && req.method === 'GET') {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const rawQuery = (parsedUrl.searchParams.get('query') || parsedUrl.searchParams.get('email') || parsedUrl.searchParams.get('phone') || '').trim();
      const cleanLower = rawQuery.toLowerCase();
      const cleanDigits = rawQuery.replace(/\D/g, '').slice(-9);

      let users = [];
      if (fs.existsSync(USERS_FILE)) {
        try {
          users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        } catch {}
      }

      // 1. Buscar en archivo de usuarios registrados o en SEED_USERS por email o teléfono
      let match = users.find(u => 
        (u.email && u.email.toLowerCase() === cleanLower) ||
        (cleanDigits.length >= 6 && (u.phone || '').replace(/\D/g, '').slice(-9) === cleanDigits) ||
        (u.name && u.name.toLowerCase() === cleanLower)
      ) || SEED_USERS.find(u => 
        (u.email && u.email.toLowerCase() === cleanLower) ||
        (cleanDigits.length >= 6 && (u.phone || '').replace(/\D/g, '').slice(-9) === cleanDigits)
      );

      // 2. Si no está, buscar en autores de publicaciones comunitarias
      if (!match && fs.existsSync(FEED_FILE)) {
        try {
          const feed = JSON.parse(fs.readFileSync(FEED_FILE, 'utf8'));
          const allItems = [...(feed.services || []), ...(feed.favors || []), ...(feed.emergencies || [])];
          const foundItem = allItems.find(i => 
            (i.author?.email && i.author.email.toLowerCase() === cleanLower) ||
            (cleanDigits.length >= 6 && (i.author?.phone || '').replace(/\D/g, '').slice(-9) === cleanDigits)
          );
          if (foundItem) {
            match = {
              name: foundItem.author.name,
              email: foundItem.author.email || `${cleanDigits}@barrio.pe`,
              phone: cleanDigits,
              password: 'Password123!',
              block: foundItem.author.block || 'Manzana C',
              avatar: foundItem.author.avatar || ''
            };
          }
        } catch {}
      }

      if (match) {
        if (!match.password) match.password = 'Password123!';
        console.log(`[Check User] ✅ Usuario verificado en base de datos: ${match.name} (${match.email || match.phone})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ exists: true, user: match }));
      } else {
        console.log(`[Check User] ❌ Usuario NO registrado en base de datos: ${rawQuery}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ exists: false }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ exists: false, error: e.message }));
    }
    return;
  }

  // Identificación directa de vecinos
  if (req.url === '/api/sync/identify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const user = JSON.parse(body);

        // Guardar de inmediato en la base de datos local de usuarios
        let record = null;
        try {
          let users = [];
          if (fs.existsSync(USERS_FILE)) {
            users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
          }
          const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-9);
          const cleanEmail = (user.email || '').trim().toLowerCase();

          const idx = users.findIndex(u => 
            (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) ||
            (cleanPhone && (u.phone || '').replace(/\D/g, '').slice(-9) === cleanPhone)
          );

          record = {
            id: user.id || (cleanPhone ? `usr_${cleanPhone}` : `usr_${Date.now()}`),
            name: user.name || 'Vecino',
            email: cleanEmail || (cleanPhone ? `${cleanPhone}@barrio.pe` : ''),
            phone: cleanPhone || user.phone || '',
            password: user.password || 'Password123!',
            block: user.block || 'Manzana C',
            address: user.address || 'Pachacamac',
            avatar: user.avatar || '',
            securityQuestions: user.securityQuestions || (idx >= 0 ? users[idx].securityQuestions : null) || {
              q1: 'boby',
              q2: 'ceviche',
              q3: 'san martin',
            }
          };

          if (idx >= 0) {
            users[idx] = { ...users[idx], ...record };
          } else {
            users.unshift(record);
          }
          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
          console.log(`[Users DB] ✅ Vecino registrado/actualizado: "${record.name}" (${record.email})`);
        } catch (errUsers) {
          console.warn('[Users DB Warning]:', errUsers.message);
        }

        // Ejecutar puente a Supabase en background
        bridgeUserToSupabase(user).catch(() => {});

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: record }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error identificando usuario' }));
      }
    });
    return;
  }

  // Actualización de Contraseña o PIN por recuperación o perfil
  if ((req.url === '/api/sync/update-password' || req.url === '/api/sync/update-pin') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { identifier, email, phone, newPassword, newPin } = payload;
        const passToSet = newPassword || newPin;
        const cleanLower = (identifier || email || '').trim().toLowerCase();
        const cleanDigits = (identifier || phone || '').replace(/\D/g, '').slice(-9);

        if ((!cleanLower && !cleanDigits) || !passToSet) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Datos incompletos para actualizar la contraseña' }));
          return;
        }

        let users = [];
        if (fs.existsSync(USERS_FILE)) {
          users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
        const idx = users.findIndex(u => 
          (cleanLower && u.email && u.email.toLowerCase() === cleanLower) ||
          (cleanDigits.length >= 6 && (u.phone || '').replace(/\D/g, '').slice(-9) === cleanDigits)
        );

        let userFound = null;
        if (idx >= 0) {
          users[idx].password = passToSet;
          users[idx].pin = passToSet;
          userFound = users[idx];
          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        }

        // Si el usuario existe en Supabase Auth, sincronizar también en la nube
        try {
          const targetEmail = cleanLower || userFound?.email;
          if (targetEmail) {
            const authList = await supabaseRequest('/auth/v1/admin/users');
            if (authList.ok && Array.isArray(authList.data?.users)) {
              const suUser = authList.data.users.find(u => u.email === targetEmail);
              if (suUser?.id) {
                await supabaseRequest(`/auth/v1/admin/users/${suUser.id}`, 'PUT', {
                  password: passToSet
                });
                console.log(`[Supabase Auth] 🔑 Contraseña actualizada en la nube para ${targetEmail}`);
              }
            }
          }
        } catch (suErr) {
          console.warn('[Supabase Auth Password Sync Warning]:', suErr.message);
        }

        console.log(`[Password Reset] ✅ Contraseña actualizada para "${cleanLower || cleanDigits}": ${passToSet}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: userFound, newPassword: passToSet }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Sincronización comunitaria en tiempo real
  if (req.url === '/api/sync/feed' && req.method === 'GET') {
    try {
      const feedData = fs.readFileSync(FEED_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(feedData);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error al leer publicaciones' }));
    }
    return;
  }

  if (req.url === '/api/sync/publish' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        let currentFeed = { services: [], favors: [], emergencies: [] };
        if (fs.existsSync(FEED_FILE)) {
          try {
            currentFeed = JSON.parse(fs.readFileSync(FEED_FILE, 'utf8'));
          } catch {}
        }

        if (item.type === 'SERVICE') {
          currentFeed.services = [item, ...currentFeed.services.filter(s => s.id !== item.id)];
        } else if (item.type === 'FAVOR') {
          currentFeed.favors = [item, ...currentFeed.favors.filter(f => f.id !== item.id)];
        } else if (item.type === 'EMERGENCY') {
          currentFeed.emergencies = [item, ...currentFeed.emergencies.filter(e => e.id !== item.id)];
        }

        fs.writeFileSync(FEED_FILE, JSON.stringify(currentFeed, null, 2));
        console.log(`[Cloud Sync] Nueva publicación recibida: [${item.type}] "${item.title}" por ${item.author?.name || 'Vecino'}`);

        // Insertar automáticamente en la base de datos Supabase
        bridgeToSupabase(item);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, item }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Formato inválido', detail: err.message }));
      }
    });
    return;
  }

  // Proxy hacia el backend en Render
  if (
    req.url.startsWith('/api/') || 
    req.url.startsWith('/actuator') || 
    req.url.startsWith('/v3/')
  ) {
    proxyToBackend(req, res);
    return;
  }

  // Archivos estáticos del frontend
  let safeUrl = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, safeUrl === '/' ? 'index.html' : safeUrl);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error interno del servidor');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[OK] Servidor de producción local + Sincronización + Supabase Bridge en http://localhost:${PORT}`);
  console.log(`[OK] Proxy activo: /api/* y /actuator/* -> ${backendParsed.origin}`);
});
