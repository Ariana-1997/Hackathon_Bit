import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT || 3000);

// Cargar variables de .env si existe
if (fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    const envLines = fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n');
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch {}
}

const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'https://hackathon-bit-uc0e.onrender.com';

let backend;
try {
  backend = new URL(BACKEND_URL);
  if (!['http:', 'https:'].includes(backend.protocol)) throw new Error('Protocolo no permitido');
} catch {
  throw new Error('BACKEND_URL debe ser una URL http(s) válida');
}

const transport = backend.protocol === 'https:' ? https : http;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function proxyToBackend(req, res) {
  const options = {
    protocol: backend.protocol,
    hostname: backend.hostname,
    port: backend.port || (backend.protocol === 'https:' ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: backend.host },
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ codigo: 'BACKEND_NO_DISPONIBLE', detail: 'No fue posible conectar con el backend.' }));
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  // Solo se enrutan endpoints oficiales de Spring Boot. No existe puente a Supabase,
  // almacenamiento JSON de usuarios, sincronización alternativa ni endpoints /api/sync.
  if (
    req.url.startsWith('/api/v1/') ||
    req.url.startsWith('/actuator/') ||
    req.url.startsWith('/v3/api-docs') ||
    req.url.startsWith('/swagger-ui')
  ) {
    proxyToBackend(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    return;
  }

  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.writeHead(500);
    res.end('Error interno');
  });
  if (req.method === 'HEAD') {
    res.writeHead(200);
    res.end();
  } else {
    res.writeHead(200);
    stream.pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend estático disponible en http://localhost:${PORT}`);
  console.log(`API de datos enrutada exclusivamente a Spring Boot: ${backend.origin}`);
});
