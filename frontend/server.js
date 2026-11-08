import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(__dirname, 'data');
const FEED_FILE = path.join(DATA_DIR, 'community_feed.json');
const USERS_FILE = path.join(DATA_DIR, 'registered_users.json');
const PORT = 3000;
const BACKEND_HOST = 'hackathon-bit-uc0e.onrender.com';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FEED_FILE)) {
  fs.writeFileSync(FEED_FILE, JSON.stringify({ services: [], favors: [], emergencies: [] }, null, 2));
}

const SEED_USERS = [
  { id: 'usr_carlos_mendoza', name: 'Carlos Mendoza', email: 'carlos.mendoza@barrio.pe', phone: '987654321', password: 'Password123!', block: 'Manzana B', address: 'Calle Los Álamos 142' },
  { id: 'usr_yummy_untiveros', name: 'Yummy Untiveros', email: 'yummy@barrio.pe', phone: '933613514', password: 'Password123!', block: 'Manzana C', address: 'La Casica - Pachacamac' },
  { id: 'usr_dona_rosa', name: 'Doña Rosa Quispe', email: 'dona.rosa@barrio.pe', phone: '911222333', password: 'Password123!', block: 'Manzana A', address: 'Pasaje San Martín 12' },
  { id: 'usr_pedro_castillo', name: 'Pedro Castillo', email: 'pedro.castillo@barrio.pe', phone: '955443322', password: 'Password123!', block: 'Manzana D', address: 'Sector 3' },
  { id: 'usr_jean', name: 'Jean', email: 'jean@barrio.pe', phone: '902322768', password: 'Password123!', block: 'Manzana C', address: 'Pachacamac' },
  { id: 'usr_sofia', name: 'Sofía Valdivia', email: 'sofia@barrio.pe', phone: '933445566', password: 'Password123!', block: 'Calle Los Pinos 110', address: 'Calle Los Pinos 110' },
  { id: 'usr_lucia_fernandez', name: 'Lucia Fernandez', email: 'lucia.fernandez@barrio.pe', phone: '976543210', password: 'Password123!', block: 'Manzana B', address: 'Av. Pachacamac 45' },
  { id: 'usr_961024198', name: 'Renato Solis', email: 'renato@barrio.pe', phone: '961024198', password: 'Password123!', block: 'Manzana C', address: 'La Casica, Mz C - Pachacamac' },
  { id: 'usr_933613515', name: 'Sandra', email: 'sandra@barrio.pe', phone: '933613515', password: 'Password123!', block: 'Manzana C', address: 'Pachacamac' },
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

// Función para reenviar peticiones hacia el backend en Render
function proxyToBackend(req, res) {
  const options = {
    hostname: BACKEND_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: BACKEND_HOST,
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*',
    });
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error conectando al backend', detail: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

// Registrar usuario directamente en Supabase mae_usuario
async function bridgeUserToSupabase(user) {
  try {
    const authorName = user.name || 'Vecino';
    const rawPhone = user.phone || '999999999';
    const authorPhone = rawPhone.replace(/\D/g, '').slice(-9).padStart(9, '9');
    const email = (user.email || `${authorPhone}@barrio.pe`).trim().toLowerCase();
    const password = user.password || 'Password123!';

    const regRes = await fetch(`https://${BACKEND_HOST}/api/v1/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        nombre: authorName,
        telefono: authorPhone,
        tipoCuenta: 'PRESTADOR',
      }),
    });
    const regData = await regRes.json();
    console.log(`[Supabase Cloud User Bridge DETAIL] Status: ${regRes.status}, Email: ${email}, Phone: ${authorPhone}, Response:`, JSON.stringify(regData));
    return regData;
  } catch (err) {
    console.warn('[Supabase Cloud User Bridge Notice]:', err.message);
  }
}

// Puente automático para guardar publicaciones en Supabase
async function bridgeToSupabase(item) {
  try {
    const authorName = item.author?.name || 'Vecino';
    const rawPhone = item.author?.phone || '999999999';
    const authorPhone = rawPhone.replace(/\D/g, '').slice(-9).padStart(9, '9');
    const slug = authorName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const email = item.author?.email || `${slug || 'vecino'}.${authorPhone.slice(-4)}@barrio.pe`;
    const password = item.author?.password || 'Password123!';

    // 1. Asegurar registro en mae_usuario
    await bridgeUserToSupabase({ name: authorName, phone: authorPhone, email, password });

    // 2. Iniciar sesión para obtener token
    const loginRes = await fetch(`https://${BACKEND_HOST}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) return;
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    if (!token) return;

    // 3. Vincular zona por GPS (RF10)
    await fetch(`https://${BACKEND_HOST}/api/v1/usuarios/me/ubicacion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ lat: -12.0464, lng: -77.0428 }),
    }).catch(() => {});

    // 4. Insertar en mae_publicacion
    if (item.type === 'SERVICE') {
      const pubRes = await fetch(`https://${BACKEND_HOST}/api/v1/servicios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoriaId: 4,
          titulo: item.title,
          descripcion: item.description,
          nombreComercial: item.title,
          telefonoContacto: authorPhone,
          precioDesde: 15.0,
          tarifaDetalle: item.priceNote || 'Precio a coordinar',
          lat: -12.0464,
          lng: -77.0428,
        }),
      });
      const pubData = await pubRes.json();
      console.log(`[Supabase Cloud Auto-Bridge] ✅ Guardado en mae_publicacion: "${item.title}" (ID: ${pubData.id}) de ${authorName}`);
    } else if (item.type === 'FAVOR') {
      const favRes = await fetch(`https://${BACKEND_HOST}/api/v1/solidaridad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo: 'SOLICITUD_AYUDA',
          categoriaId: 4,
          titulo: item.title,
          descripcion: item.description,
          lat: -12.0464,
          lng: -77.0428,
        }),
      });
      const favData = await favRes.json();
      console.log(`[Supabase Cloud Auto-Bridge] ✅ Favor guardado en mae_publicacion (ID: ${favData.id}) de ${authorName}`);
    }
  } catch (err) {
    console.warn('[Supabase Cloud Auto-Bridge Warning]:', err.message);
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
            avatar: user.avatar || ''
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

  // Actualización de PIN por recuperación o perfil
  if (req.url === '/api/sync/update-pin' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { phone, newPin } = JSON.parse(body);
        const clean = (phone || '').replace(/\D/g, '').slice(-9);
        if (!clean || !newPin) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Datos incompletos' }));
          return;
        }

        let users = [];
        if (fs.existsSync(USERS_FILE)) {
          users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
        const idx = users.findIndex(u => (u.phone || '').replace(/\D/g, '').slice(-9) === clean);
        if (idx >= 0) {
          users[idx].pin = newPin;
          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        }

        console.log(`[PIN Reset] ✅ PIN actualizado para ${clean}: ${newPin}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, phone: clean, pin: newPin }));
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
  console.log(`[OK] Proxy activo: /api/* y /actuator/* -> https://${BACKEND_HOST}`);
});
