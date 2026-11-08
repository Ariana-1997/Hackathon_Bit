/**
 * @fileoverview Servicio de geolocalización hiperlocal y cálculo de distancias caminables
 */

export const geolocationService = {
  /**
   * Calcula la distancia en metros entre dos puntos geográficos (Fórmula Haversine)
   */
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  },

  /**
   * Convierte distancia en metros a texto amigable con tiempo aproximado a pie
   * Velocidad promedio de caminata humana: ~80 metros por minuto
   */
  formatProximity(meters) {
    if (!meters || meters < 20) return 'A unos pasos (menos de 1 min)';
    const minutes = Math.max(1, Math.round(meters / 80));
    
    if (meters < 1000) {
      return `A ${meters} m (~${minutes} min a pie)`;
    }
    const km = (meters / 1000).toFixed(1);
    return `A ${km} km (~${minutes} min a pie)`;
  },

  /**
   * Guarda la última posición GPS válida (para usarla cuando no hay señal / internet)
   */
  saveLastPosition(lat, lng) {
    try {
      localStorage.setItem('vecinos_last_position', JSON.stringify({ lat, lng, ts: Date.now() }));
    } catch {
      // localStorage no disponible: se ignora
    }
  },

  /**
   * Devuelve la última posición GPS guardada ({ lat, lng, ts }) o null
   */
  getLastPosition() {
    try {
      const raw = JSON.parse(localStorage.getItem('vecinos_last_position'));
      if (raw && Number.isFinite(raw.lat) && Number.isFinite(raw.lng)) return raw;
    } catch {
      // dato corrupto: se ignora
    }
    return null;
  },

  /**
   * Obtiene la posición actual del usuario con fallback seguro
   * (último GPS conocido y, si no existe, las coordenadas del barrio)
   */
  async getCurrentPosition(fallbackCoords = { lat: -12.0862, lng: -77.0503 }) {
    const last = this.getLastPosition();
    const safeFallback = last ? { lat: last.lat, lng: last.lng } : fallbackCoords;

    if (!('geolocation' in navigator)) {
      return safeFallback;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.saveLastPosition(coords.lat, coords.lng);
          resolve(coords);
        },
        (error) => {
          console.warn('Geolocalización denegada o inaccesible, usando última ubicación conocida:', error.message);
          resolve(safeFallback);
        },
        { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
      );
    });
  }
};
