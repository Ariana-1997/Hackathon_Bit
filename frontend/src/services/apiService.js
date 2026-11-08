/**
 * RedVecinal API Service
 * Conexión cliente entre el Frontend React y el Backend Spring Boot 3 + Supabase
 * Enrutamiento exclusivo por API REST oficial (/api/v1).
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api/v1';

const TOKEN_KEY = 'redvecinal_auth_token';
const REFRESH_KEY = 'redvecinal_refresh_token';

// Mapeo de categorías del frontend a IDs de def_categoria (ECONOMIA)
const SERVICE_CAT_MAP = {
  gasfiteria: 1,
  plomerie: 1,
  electricidad: 1,
  cerrajeria: 1,
  carpinteria: 1,
  hogar: 1,
  vehiculos: 2,
  mascotas: 3,
  costura: 3,
  personal: 3,
  alimentos: 4,
  alimentacion: 4,
  comercio: 4,
  tecnologia: 5,
  clases: 6,
  educacion: 6,
  otros: 7,
};

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

  // Renovación automática de token (Refresh Token rotation)
  async refrescarSesion() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      this.clearSession();
      return null;
    }
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        this.clearSession();
        return null;
      }
      const data = await res.json();
      if (data.accessToken) {
        this.setSession(data.accessToken, data.refreshToken || refreshToken);
        return data.accessToken;
      }
    } catch {
      this.clearSession();
    }
    return null;
  }

  // Petición autenticada con reintento automático ante expiración de token (401)
  async fetchWithAuth(url, options = {}) {
    const headers = this.getHeaders(options.headers);
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401 && localStorage.getItem(REFRESH_KEY)) {
      const nuevoToken = await this.refrescarSesion();
      if (nuevoToken) {
        const retryHeaders = this.getHeaders(options.headers);
        res = await fetch(url, { ...options, headers: retryHeaders });
      }
    }
    return res;
  }

  // 1. Health check del backend (Spring Boot Actuator)
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
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || (res.status === 401 ? 'Correo o contraseña incorrectos' : 'Error al iniciar sesión');
      const err = new Error(errorMsg);
      err.detail = data.detail;
      err.codigo = data.codigo;
      err.status = res.status;
      throw err;
    }
    this.setSession(data.accessToken, data.refreshToken);
    return data;
  }

  async registro({ email, password, nombre, telefono }) {
    const cleanPhone = telefono ? telefono.toString().replace(/\D/g, '').slice(-9) : null;
    const bodyPayload = {
      email: email.trim().toLowerCase(),
      password,
      nombre: nombre.trim(),
    };
    if (cleanPhone && cleanPhone.length === 9) {
      bodyPayload.telefono = cleanPhone;
    }

    const res = await fetch(`${this.baseUrl}/auth/registro`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(bodyPayload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Error ${res.status}: ${data.codigo || 'Error al registrarse'}`;
      const err = new Error(errorMsg);
      err.detail = data.detail;
      err.codigo = data.codigo;
      err.status = res.status;
      throw err;
    }
    if (data.accessToken) this.setSession(data.accessToken, data.refreshToken);
    return data;
  }

  async recuperarPassword(email) {
    const res = await fetch(`${this.baseUrl}/auth/recuperar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'No se pudo solicitar la recuperación.');
    }
  }

  async logout() {
    try {
      if (this.token) {
        await this.fetchWithAuth(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
        });
      }
    } finally {
      this.clearSession();
    }
  }

  // 3. Perfil del Usuario
  async getMiPerfil() {
    const res = await this.fetchWithAuth(`${this.baseUrl}/usuarios/me`);
    if (!res.ok) throw new Error('No se pudo obtener el perfil');
    return await res.json();
  }

  async actualizarPerfil(nombre, telefono) {
    const cleanPhone = telefono ? telefono.toString().replace(/\D/g, '').slice(-9) : null;
    const res = await this.fetchWithAuth(`${this.baseUrl}/usuarios/me`, {
      method: 'PUT',
      body: JSON.stringify({ 
        nombre: (nombre || '').trim(), 
        telefono: (cleanPhone && cleanPhone.length === 9) ? cleanPhone : null 
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.detail || data.message || 'No se pudo actualizar el perfil');
      err.detail = data.detail;
      throw err;
    }
    return data;
  }

  async actualizarUbicacion(lat, lng) {
    const res = await this.fetchWithAuth(`${this.baseUrl}/usuarios/me/ubicacion`, {
      method: 'PUT',
      body: JSON.stringify({ lat: Number(lat), lng: Number(lng) }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'No se pudo actualizar la ubicación');
    }
    return await res.json();
  }

  // 4. Módulo Servicios (Economía Local)
  async getServicios(params = {}) {
    await this.ensureSession();
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/servicios${query ? `?${query}` : ''}`;
    const res = await this.fetchWithAuth(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || 'Error al cargar servicios');
    }
    return await res.json();
  }

  async crearServicio(servicioData) {
    await this.ensureSession();
    const res = await this.fetchWithAuth(`${this.baseUrl}/servicios`, {
      method: 'POST',
      body: JSON.stringify(servicioData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Error ${res.status}: ${data.codigo || 'Fallo al publicar servicio'}`;
      const err = new Error(errorMsg);
      err.detail = data.detail;
      err.codigo = data.codigo;
      err.status = res.status;
      throw err;
    }
    return data;
  }

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

      return list.map((s) => ({
        id: s.id,
        title: s.titulo,
        category: s.categoriaNombre?.toLowerCase()?.includes('alim') ? 'oficios' : (s.categoriaNombre?.toLowerCase() || 'oficios'),
        description: s.nombreComercial || s.titulo,
        priceNote: s.precioDesde ? `Desde S/ ${s.precioDesde}` : 'Precio a coordinar por WhatsApp',
        author: {
          name: s.nombreComercial || s.titulo || 'Vecino',
          phone: s.telefonoContacto || '',
          block: s.zonaNombre || 'Vecindario',
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
        createdAt: s.createdAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[Fetch Cloud Services Error]:', err.message);
      return null;
    }
  }

  // Publicación a través de Spring Boot
  async publicarEnBackend(item, user) {
    await this.ensureSession();

    // 1. Asegurar ubicación de zona en PostGIS (RF10)
    const lat = item.lat ?? user?.lat;
    const lng = item.lng ?? user?.lng;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
      throw new Error('Debes compartir una ubicación GPS válida antes de publicar.');
    }
    await this.actualizarUbicacion(Number(lat), Number(lng));

    // 2. Extraer teléfono limpio
    const rawPhone = user?.phone || item.author?.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-9);

    // 3. Enviar la publicación a Spring Boot según el tipo
    if (item.type === 'SERVICE') {
      const catKey = (item.category || '').toString().toLowerCase().trim();
      const catId = SERVICE_CAT_MAP[catKey] || 7; // 7 = OTROS en ECONOMIA

      // Extraer precio numérico si está presente
      const matchPrice = (item.priceNote || '').match(/(\d+(?:\.\d+)?)/);
      const precioDesde = matchPrice ? parseFloat(matchPrice[1]) : 15.0;

      const payload = {
        categoriaId: catId,
        titulo: item.title,
        descripcion: item.description || item.title,
        nombreComercial: item.title,
        telefonoContacto: cleanPhone.length === 9 ? cleanPhone : null,
        precioDesde: precioDesde,
        tarifaDetalle: item.priceNote || 'Precio a coordinar por WhatsApp',
        lat: Number(lat),
        lng: Number(lng),
      };

      return await this.crearServicio(payload);

    } else if (item.type === 'FAVOR') {
      // El backend requiere justificación obligatoria para SOLICITUD_AYUDA
      // y deduce la categoría automáticamente (AYUDA_GENERAL) si categoriaId es omitido.
      const payload = {
        tipo: 'SOLICITUD_AYUDA',
        titulo: item.title,
        descripcion: item.description || item.title,
        justificacion: item.description || item.title || 'Solicitud de apoyo vecinal',
        lat: Number(lat),
        lng: Number(lng),
      };

      return await this.crearSolidaridad(payload);
    }
    return null;
  }

  // 5. Módulo Solidaridad (Cadena de Favores)
  async getSolidaridad(params = {}) {
    await this.ensureSession();
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/solidaridad${query ? `?${query}` : ''}`;
    const res = await this.fetchWithAuth(url);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Error al cargar favores');
    }
    return await res.json();
  }

  async crearSolidaridad(favorData) {
    await this.ensureSession();
    const res = await this.fetchWithAuth(`${this.baseUrl}/solidaridad`, {
      method: 'POST',
      body: JSON.stringify(favorData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Error ${res.status}: ${data.codigo || 'Error al publicar favor'}`;
      const err = new Error(errorMsg);
      err.detail = data.detail;
      err.codigo = data.codigo;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // 6. Módulo Emergencias (Alertas SOS en Tiempo Real)
  async getEmergencias() {
    await this.ensureSession();
    const res = await this.fetchWithAuth(`${this.baseUrl}/emergencias/dashboard`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.message || 'Error al cargar emergencias');
    }
    return await res.json();
  }

  async reportarEmergencia(emergenciaData) {
    await this.ensureSession();
    const res = await this.fetchWithAuth(`${this.baseUrl}/emergencias/reportes`, {
      method: 'POST',
      body: JSON.stringify(emergenciaData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errorMsg = data.detail || data.message || `Error ${res.status}: ${data.codigo || 'Error al enviar alerta SOS'}`;
      const err = new Error(errorMsg);
      err.detail = data.detail;
      err.codigo = data.codigo;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // SSE autenticado con ReadableStream
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
              // Ignorar eventos keep-alive
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
