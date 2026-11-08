/**
 * @fileoverview Servicio de almacenamiento local resiliente (Offline-First)
 * Permite persistencia de datos en LocalStorage con cola de sincronización.
 */

const STORAGE_KEYS = {
  SERVICES: 'vecinos_services_data',
  FAVORS: 'vecinos_favors_data',
  EMERGENCIES: 'vecinos_emergencies_data',
  APP_MODE: 'vecinos_current_mode',
  TUTORIAL_SEEN: 'vecinos_tutorial_completed',
  OFFLINE_QUEUE: 'vecinos_offline_queue',
  USER_PROFILE: 'vecinos_user_profile',
  REGISTERED_USERS: 'vecinos_registered_users_list',
};

export const storageService = {
  // Inicialización de datos
  get(key, defaultValue) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading from localStorage (${key}):`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving to localStorage (${key}):`, e);
    }
  },

  // Servicios de oficios
  purgeLegacySensitiveData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.REGISTERED_USERS);
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch {}
  },

  sanitizePublications(items = []) {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const { password, pin, ...safeAuthor } = item.author || {};
      return { ...item, author: item.author ? safeAuthor : item.author };
    });
  },

  getServices(initialData = []) {
    this.purgeLegacySensitiveData();
    const safe = this.sanitizePublications(this.get(STORAGE_KEYS.SERVICES, initialData));
    this.set(STORAGE_KEYS.SERVICES, safe);
    return safe;
  },

  saveServices(services) {
    this.set(STORAGE_KEYS.SERVICES, this.sanitizePublications(services));
  },

  // Favores solidarios
  getFavors(initialData = []) {
    const safe = this.sanitizePublications(this.get(STORAGE_KEYS.FAVORS, initialData));
    this.set(STORAGE_KEYS.FAVORS, safe);
    return safe;
  },

  saveFavors(favors) {
    this.set(STORAGE_KEYS.FAVORS, this.sanitizePublications(favors));
  },

  // Emergencias
  getEmergencies(initialData = []) {
    const safe = this.sanitizePublications(this.get(STORAGE_KEYS.EMERGENCIES, initialData));
    this.set(STORAGE_KEYS.EMERGENCIES, safe);
    return safe;
  },

  saveEmergencies(emergencies) {
    this.set(STORAGE_KEYS.EMERGENCIES, this.sanitizePublications(emergencies));
  },

  // Modo de la aplicación (NORMAL | EMERGENCY)
  getAppMode(defaultMode = 'NORMAL') {
    return this.get(STORAGE_KEYS.APP_MODE, defaultMode);
  },

  saveAppMode(mode) {
    this.set(STORAGE_KEYS.APP_MODE, mode);
  },

  // Tutorial visto
  isTutorialSeen() {
    return this.get(STORAGE_KEYS.TUTORIAL_SEEN, false);
  },

  setTutorialSeen(seen = true) {
    this.set(STORAGE_KEYS.TUTORIAL_SEEN, seen);
  },

  // Cola de sincronización cuando está offline
  addToOfflineQueue(item) {
    const queue = this.get(STORAGE_KEYS.OFFLINE_QUEUE, []);
    queue.push({
      ...item,
      queuedAt: new Date().toISOString(),
    });
    this.set(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  getOfflineQueue() {
    return this.get(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  clearOfflineQueue() {
    this.set(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  // Perfil del Vecino
  getUserProfile(defaultUser = null) {
    this.purgeLegacySensitiveData();
    const profile = this.get(STORAGE_KEYS.USER_PROFILE, defaultUser);
    if (!profile || typeof profile !== 'object') return defaultUser;
    const { password, pin, securityQuestions, ...safeProfile } = profile;
    this.set(STORAGE_KEYS.USER_PROFILE, safeProfile);
    try { localStorage.removeItem(STORAGE_KEYS.REGISTERED_USERS); } catch {}
    return safeProfile;
  },

  saveUserProfile(profile) {
    if (!profile || typeof profile !== 'object') return;
    const { password, pin, securityQuestions, ...safeProfile } = profile;
    this.set(STORAGE_KEYS.USER_PROFILE, safeProfile);
  },

  clearUserProfile() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (e) {
      console.warn('Error clearing profile:', e);
    }
  },

  // El navegador no es una fuente de autenticación ni almacena credenciales.
  getRegisteredUsers() {
    try { localStorage.removeItem(STORAGE_KEYS.REGISTERED_USERS); } catch {}
    return [];
  },

  saveRegisteredUser() {
    return null;
  },

  findRegisteredUser() {
    return null;
  },

  updateUserPassword() {
    return false;
  },

  updateUserPin() {
    return false;
  }
};
