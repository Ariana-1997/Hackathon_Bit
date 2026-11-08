/**
 * RedVecinal API Service
 * Conexión configurable entre el Frontend React y el Backend Spring Boot 3 + Supabase
 * Por defecto apunta al backend local del equipo (http://localhost:8080) o al configurado en VITE_BACKEND_URL
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1';

const TOKEN_KEY = 'redvecinal_auth_token';
const REFRESH_KEY = 'redvecinal_refresh_token';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem(TOKEN_KEY) || null;
  }

  // Guardar y recuperar token JWT
  setSession(accessToken, refreshToken) {
    this.token = accessToken;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_KEY);
    }
  }

  clearSession() {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Todas las operaciones de negocio se realizan contra la API Spring Boot.
  // No hay rutas alternativas /api/sync ni llamadas directas desde el navegador a Supabase.

  // Health check por el mismo origen; el proxy lo reenvía a Spring Boot.
  async checkHealth() {
    try {
      const response = await fetch('/actuator/health', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return { isOnline: false };
      const data = await response.json();
      return { isOnline: data.status === 'UP', data };
    } catch {
      return { isOnline: false };
    }
  }

  // 2. Módulo de Autenticación
  async login(email, password) {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || 'Error al iniciar sesión');
    this.setSession(data.accessToken, data.refreshToken);
    return data;
  }

  async registro({ email, password, nombre, telefono, tipoCuenta = 'VECINO' }) {
    const res = await fetch(`${this.baseUrl}/auth/registro`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, nombre, telefono, tipoCuenta }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || 'Error al registrarse');
    if (data.accessToken) this.setSession(data.accessToken, data.refreshToken);
    return data;
  }

  async recuperarPassword(email) {
    const res = await fetch(`${this.baseUrl}/auth/recuperar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'No se pudo solicitar la recuperación.');
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: this.getHeaders(),
        });
      }
    } finally {
      this.clearSession();
    }
  }

  // 3. Perfil del Usuario
  async getMiPerfil() {
    const res = await fetch(`${this.baseUrl}/usuarios/me`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('No se pudo obtener el perfil');
    return await res.json();
  }

  async actualizarPerfil(nombre, telefono) {
    const res = await fetch(`${this.baseUrl}/usuarios/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ nombre, telefono }),
    });
    if (!res.ok) throw new Error('No se pudo actualizar el perfil');
    return await res.json();
  }

  async actualizarUbicacion(lat, lng) {
    const res = await fetch(`${this.baseUrl}/usuarios/me/ubicacion`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ lat, lng }),
    });
    if (!res.ok) throw new Error('No se pudo actualizar la ubicación');
    return await res.json();
  }

  // 4. Módulo Servicios (Economía Local)
  async getServicios(params = {}) {
    await this.ensureSession();
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/servicios${query ? `?${query}` : ''}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Error al cargar servicios');
    }
    return await res.json();
  }

  async crearServicio(servicioData) {
    await this.ensureSession();
    const res = await fetch(`${this.baseUrl}/servicios`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(servicioData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Error ${res.status}: ${data.codigo || 'Fallo al publicar'}`;
      const err = new Error(errorMsg);
      err.detail = data.detail;
      err.codigo = data.codigo;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // No crear cuentas demo ni credenciales automáticas. La sesión debe venir del login real.
  async ensureSession() {
    if (!this.token) {
      throw new Error('Debes iniciar sesión con una cuenta registrada para continuar.');
    }
    return this.token;
  }

  // Cargar servicios desde la API del backend (Spring Boot)
  async fetchCloudServices() {
    try {
      const raw = await this.getServicios();
      const list = raw.contenido || (Array.isArray(raw) ? raw : []);
      if (!list || list.length === 0) return [];

      const formatted = await Promise.all(
        list.map(async (s) => {
          let detail = s;
          try {
            const dRes = await fetch(`${this.baseUrl}/servicios/${s.id}`, { headers: this.getHeaders() });
            if (dRes.ok) {
              detail = await dRes.json();
            }
          } catch {}

          const cleanPhone = detail.telefonoContacto || s.telefonoContacto || '';
          const authorName = detail.autorNombre || s.nombreComercial || s.titulo;

          return {
            id: s.id,
            title: s.titulo,
            category: s.categoriaNombre?.toLowerCase()?.includes('alim') ? 'oficios' : (s.categoriaNombre?.toLowerCase() || 'oficios'),
            description: detail.descripcion || s.nombreComercial || s.titulo,
            priceNote: detail.tarifaDetalle || (s.precioDesde ? `Desde S/ ${s.precioDesde}` : 'Precio a coordinar'),
            author: {
              name: authorName,
              phone: cleanPhone,
              block: 'Manzana C',
              avatar: '',
              isVerified: true,
            },
            distanceMeters: s.distanciaM ?? null,
            lat: s.lat ?? null,
            lng: s.lng ?? null,
            endorsementsCount: s.totalValoraciones || 0,
            endorsements: [],
            availableInEmergency: true,
            isAvailableNow: true,
            isCloudSynced: true,
            createdAt: detail.createdAt || new Date().toISOString(),
          };
        })
      );

      return formatted;
    } catch (err) {
      console.warn('[Fetch Cloud Services Error]:', err.message);
      return null;
    }
  }

  // Publicación a través de Spring Boot; el navegador nunca se conecta directamente a la base de datos
  async publicarEnBackend(item, user) {
    const cleanPhone = (user?.phone || '').replace(/\D/g, '').slice(-9);

    // 1. Asegurar sesión
    await this.ensureSession(user);

    if (!this.token) {
      throw new Error('No se pudo establecer sesión con el servidor');
    }

    // 2. Asegurar ubicación de zona en PostGIS (RF10)
    const lat = item.lat ?? user?.lat;
    const lng = item.lng ?? user?.lng;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      throw new Error('Debes compartir una ubicación válida antes de publicar.');
    }
    await this.actualizarUbicacion(Number(lat), Number(lng));

    // 3. Enviar la publicación a Spring Boot
    if (item.type === 'SERVICE') {
      const payload = {
        categoriaId: 4,
        titulo: item.title,
        descripcion: item.description,
        nombreComercial: item.title,
        telefonoContacto: cleanPhone,
        precioDesde: 15.0,
        tarifaDetalle: item.priceNote || 'Precio a coordinar por WhatsApp',
        lat,
        lng,
      };
      try {
        const created = await this.crearServicio(payload);
        console.log('[Backend] Servicio creado correctamente.');
        return created;
      } catch (err) {
        throw err;
      }
    } else if (item.type === 'FAVOR') {
      const payload = {
        tipo: 'SOLICITUD_AYUDA',
        categoriaId: 4,
        titulo: item.title,
        descripcion: item.description,
        lat,
        lng,
      };
      try {
        const created = await this.crearSolidaridad(payload);
        console.log('[Backend] Publicación solidaria creada correctamente.');
        return created;
      } catch (err) {
        throw err;
      }
    }
    return null;
  }

  // 5. Módulo Solidaridad (Cadena de Favores)
  async getSolidaridad(params = {}) {
    await this.ensureSession();
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/solidaridad${query ? `?${query}` : ''}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Error al cargar favores');
    return await res.json();
  }

  async crearSolidaridad(favorData) {
    await this.ensureSession();
    const res = await fetch(`${this.baseUrl}/solidaridad`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(favorData),
    });
    if (!res.ok) throw new Error('Error al publicar favor');
    return await res.json();
  }

  // 6. Módulo Emergencias (Alertas SOS en Tiempo Real)
  async getEmergencias() {
    await this.ensureSession();
    const res = await fetch(`${this.baseUrl}/emergencias/dashboard`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Error al cargar emergencias');
    return await res.json();
  }

  async reportarEmergencia(emergenciaData) {
    await this.ensureSession();
    const res = await fetch(`${this.baseUrl}/emergencias/reportes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(emergenciaData),
    });
    if (!res.ok) throw new Error('Error al enviar alerta de auxilio');
    return await res.json();
  }

  // SSE autenticado: EventSource no permite enviar Authorization Bearer,
  // por eso se utiliza fetch + ReadableStream.
  crearStreamEmergencias(onNuevaEmergencia, onError) {
    const controller = new AbortController();
    const url = `${this.baseUrl}/emergencias/stream`;

    (async () => {
      try {
        const response = await fetch(url, {
          headers: { ...this.getHeaders(), Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error(`No se pudo abrir el flujo de emergencias (${response.status}).`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || '';
          for (const eventText of events) {
            const dataLine = eventText.split(/\r?\n/).find((line) => line.startsWith('data:'));
            if (!dataLine) continue;
            try {
              onNuevaEmergencia(JSON.parse(dataLine.slice(5).trim()));
            } catch {
              // Ignorar eventos keep-alive o mensajes no JSON.
            }
          }
        }
      } catch (error) {
        if (!controller.signal.aborted && onError) onError(error);
      }
    })();

    return { close: () => controller.abort() };
  }

  // 7. Directorio de soporte
  async getContactosSoporte() {
    const res = await fetch(`${this.baseUrl}/contactos-soporte`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener contactos');
    return await res.json();
  }
}

export const apiService = new ApiService();
export default apiService;
