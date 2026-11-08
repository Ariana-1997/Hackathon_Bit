// Prueba de carga inicial (RNF-10): 100 usuarios concurrentes.
// Uso: k6 run -e BASE=http://localhost:8080 -e TOKEN=<access_token> docs/carga/k6-catalogo.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '2m',
  thresholds: {
    'http_req_duration{tipo:consulta}': ['p(95)<2000'],   // RNF-01
    'http_req_duration{tipo:busqueda}': ['p(95)<3000'],   // RNF-03
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE || 'http://localhost:8080';
const params = { headers: { Authorization: `Bearer ${__ENV.TOKEN}` } };

export default function () {
  const r1 = http.get(`${BASE}/api/v1/servicios?page=0&size=20`, { ...params, tags: { tipo: 'consulta' } });
  check(r1, { 'catálogo 200': (r) => r.status === 200 });

  const r2 = http.get(`${BASE}/api/v1/servicios/cercanos?lat=-12.0464&lng=-77.0428&radioKm=2`,
    { ...params, tags: { tipo: 'busqueda' } });
  check(r2, { 'cercanos 200': (r) => r.status === 200 });

  const r3 = http.get(`${BASE}/api/v1/solidaridad?page=0&size=20`, { ...params, tags: { tipo: 'consulta' } });
  check(r3, { 'feed 200': (r) => r.status === 200 });
  sleep(1);
}
