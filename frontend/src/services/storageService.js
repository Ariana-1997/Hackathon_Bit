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

const DEFAULT_USERS_CATALOG = [
  {
    id: 'usr_carlos_mendoza',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@barrio.pe',
    phone: '987654321',
    password: 'Password123!',
    address: 'Calle Los Álamos 142',
    block: 'Manzana B',
    avatar: '',
  },
  {
    id: 'usr_yummy_untiveros',
    name: 'Yummy Untiveros',
    email: 'yummy@barrio.pe',
    phone: '933613514',
    password: 'Password123!',
    address: 'La Casica - Pachacamac',
    block: 'Manzana C',
    avatar: '',
  },
  {
    id: 'usr_dona_rosa',
    name: 'Doña Rosa Quispe',
    email: 'dona.rosa@barrio.pe',
    phone: '911222333',
    password: 'Password123!',
    address: 'Pasaje San Martín 12',
    block: 'Manzana A',
    avatar: '',
  },
  {
    id: 'usr_lucia_fernandez',
    name: 'Lucia Fernandez',
    email: 'lucia.fernandez@barrio.pe',
    phone: '976543210',
    password: 'Password123!',
    address: 'Av. Pachacamac 45',
    block: 'Manzana B',
    avatar: '',
  },
  {
    id: 'usr_961024198',
    name: 'Renato Solis',
    email: 'renato@barrio.pe',
    phone: '961024198',
    password: 'Password123!',
    address: 'La Casica, Mz C - Pachacamac',
    block: 'Manzana C',
    avatar: '',
  },
  {
    id: 'usr_933613515',
    name: 'Sandra',
    email: 'sandra@barrio.pe',
    phone: '933613515',
    password: 'Password123!',
    address: 'Pachacamac',
    block: 'Manzana C',
    avatar: '',
  },
  {
    id: 'usr_pedro_castillo',
    name: 'Pedro Castillo',
    email: 'pedro.castillo@barrio.pe',
    phone: '987111222',
    password: 'Password123!',
    address: 'Sector 3',
    block: 'Manzana D',
    avatar: '',
  },
];

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
  getServices(initialData = []) {
    return this.get(STORAGE_KEYS.SERVICES, initialData);
  },

  saveServices(services) {
    this.set(STORAGE_KEYS.SERVICES, services);
  },

  // Favores solidarios
  getFavors(initialData = []) {
    return this.get(STORAGE_KEYS.FAVORS, initialData);
  },

  saveFavors(favors) {
    this.set(STORAGE_KEYS.FAVORS, favors);
  },

  // Emergencias
  getEmergencies(initialData = []) {
    return this.get(STORAGE_KEYS.EMERGENCIES, initialData);
  },

  saveEmergencies(emergencies) {
    this.set(STORAGE_KEYS.EMERGENCIES, emergencies);
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

  setOfflineQueue(queue) {
    this.set(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  },

  clearOfflineQueue() {
    this.set(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  // Perfil del Vecino
  getUserProfile(defaultUser = null) {
    return this.get(STORAGE_KEYS.USER_PROFILE, defaultUser);
  },

  saveUserProfile(profile) {
    this.set(STORAGE_KEYS.USER_PROFILE, profile);
  },

  clearUserProfile() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (e) {
      console.warn('Error clearing profile:', e);
    }
  },

  // Directorio local de vecinos registrados (para Iniciar Sesión rápido)
  getRegisteredUsers() {
    return this.get(STORAGE_KEYS.REGISTERED_USERS, DEFAULT_USERS_CATALOG);
  },

  saveRegisteredUser(user) {
    if (!user) return;
    const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-9);
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const users = this.getRegisteredUsers();
    
    const existingIndex = users.findIndex(u => {
      if (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail) return true;
      if (cleanPhone && (u.phone || '').replace(/\D/g, '').slice(-9) === cleanPhone) return true;
      return false;
    });
    
    const record = {
      id: user.id || (cleanPhone ? `usr_${cleanPhone}` : `usr_${Date.now()}`),
      name: user.name || 'Vecino',
      email: cleanEmail || (cleanPhone ? `${cleanPhone}@barrio.pe` : ''),
      password: user.password || 'Password123!',
      phone: cleanPhone || user.phone || '',
      address: user.address || '',
      block: user.block || (user.address || 'Pachacamac'),
      avatar: user.avatar || '',
      lat: user.lat || -12.0464,
      lng: user.lng || -77.0428,
      isRegistered: true,
      isVerifiedNeighbor: true,
    };

    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...record };
    } else {
      users.unshift(record);
    }
    this.set(STORAGE_KEYS.REGISTERED_USERS, users);
    return record;
  },

  findRegisteredUser(identifier) {
    if (!identifier) return null;
    const clean = identifier.toString().trim();
    const cleanLower = clean.toLowerCase();
    const cleanDigits = clean.replace(/\D/g, '').slice(-9);
    const users = this.getRegisteredUsers();
    
    return users.find(u => {
      if (u.email && u.email.toLowerCase() === cleanLower) return true;
      const uDigits = (u.phone || '').replace(/\D/g, '').slice(-9);
      if (cleanDigits.length >= 6 && uDigits === cleanDigits) return true;
      if (u.name && u.name.toLowerCase().includes(cleanLower)) return true;
      return false;
    }) || null;
  },

  updateUserPin(phone, newPin) {
    if (!phone || !newPin) return false;
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-9);
    const users = this.getRegisteredUsers();
    const idx = users.findIndex(u => (u.phone || '').replace(/\D/g, '').slice(-9) === cleanPhone);
    if (idx >= 0) {
      users[idx] = { ...users[idx], pin: newPin };
      this.set(STORAGE_KEYS.REGISTERED_USERS, users);
      return true;
    }
    return false;
  }
};
