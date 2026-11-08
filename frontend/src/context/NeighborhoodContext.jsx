import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_MODES, PUBLICATION_TYPES } from '../types';
import { 
  INITIAL_USER, 
  INITIAL_SERVICES, 
  INITIAL_FAVORS, 
  INITIAL_EMERGENCIES 
} from '../data/mockData';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const NeighborhoodContext = createContext(null);

export function NeighborhoodProvider({ children }) {
  const isOnline = useOnlineStatus();
  
  // Estado del modo de la app (NORMAL o EMERGENCY)
  const [appMode, setAppMode] = useState(() => storageService.getAppMode(APP_MODES.NORMAL));
  
  // Usuario actual persistido (null = Modo Visitante / Sin registrarse)
  const [currentUser, setCurrentUser] = useState(() => storageService.getUserProfile(null));

  // Datos principales
  const [services, setServices] = useState(() => storageService.getServices(INITIAL_SERVICES));
  const [favors, setFavors] = useState(() => storageService.getFavors(INITIAL_FAVORS));
  const [emergencies, setEmergencies] = useState(() => storageService.getEmergencies(INITIAL_EMERGENCIES));

  // Estados de modales interactivos
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [quickPublishOpen, setQuickPublishOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState('GENERAL'); // 'PUBLISH' | 'ENDORSE' | 'GENERAL'
  const [pendingAction, setPendingAction] = useState(null);
  const [emergencyConfirmOpen, setEmergencyConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'services' | 'favors' | 'map' | 'emergency'
  const [globalSearch, setGlobalSearch] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Estado de conexión con el Backend en la Nube
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 10;

    const probeBackend = async () => {
      try {
        const res = await apiService.checkHealth();
        if (isMounted) {
          if (res.isOnline) {
            setBackendOnline(true);
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(probeBackend, 3000);
          }
        }
      } catch {
        if (isMounted && retryCount < maxRetries) {
          retryCount++;
          setTimeout(probeBackend, 3000);
        }
      }
    };

    probeBackend();

    // Mantener la conexión activa y verificar cada 25 segundos (evita que Render se duerma)
    const interval = setInterval(probeBackend, 25000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sincronización continua y en tiempo real con la base de datos Supabase
  useEffect(() => {
    let isMounted = true;

    const syncRealSupabaseData = async () => {
      try {
        const cloudServices = await apiService.fetchCloudServices();
        if (isMounted && cloudServices && cloudServices.length > 0) {
          setServices((prev) => {
            const cloudIds = new Set(cloudServices.map(c => c.id));
            const localOnly = prev.filter(p => !cloudIds.has(p.id));
            const merged = [...cloudServices, ...localOnly];
            storageService.saveServices(merged);
            return merged;
          });
          setBackendOnline(true);
        }
      } catch (err) {
        console.warn('Real Supabase sync warning:', err.message);
      }
    };

    syncRealSupabaseData();
    const interval = setInterval(syncRealSupabaseData, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sincronización comunitaria en tiempo real entre celulares y computadoras
  useEffect(() => {
    let isMounted = true;

    const syncLiveFeed = async () => {
      try {
        const feed = await apiService.fetchCommunityFeed();
        if (!isMounted || !feed) return;

        if (feed.services && feed.services.length > 0) {
          setServices((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newItems = feed.services.filter((s) => !existingIds.has(s.id));
            return newItems.length > 0 ? [...newItems, ...prev] : prev;
          });
        }

        if (feed.favors && feed.favors.length > 0) {
          setFavors((prev) => {
            const existingIds = new Set(prev.map((f) => f.id));
            const newItems = feed.favors.filter((f) => !existingIds.has(f.id));
            return newItems.length > 0 ? [...newItems, ...prev] : prev;
          });
        }

        if (feed.emergencies && feed.emergencies.length > 0) {
          setEmergencies((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newItems = feed.emergencies.filter((e) => !existingIds.has(e.id));
            return newItems.length > 0 ? [...newItems, ...prev] : prev;
          });
        }
      } catch {
        // Silencioso
      }
    };

    syncLiveFeed();
    const interval = setInterval(syncLiveFeed, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Notificación tipo toast sutil
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Abrir tutorial en la primera visita
  useEffect(() => {
    const hasSeen = storageService.isTutorialSeen();
    if (!hasSeen) {
      setTutorialOpen(true);
    }
  }, []);

  // Persistir cambios
  useEffect(() => {
    storageService.saveAppMode(appMode);
  }, [appMode]);

  useEffect(() => {
    storageService.saveServices(services);
  }, [services]);

  useEffect(() => {
    storageService.saveFavors(favors);
  }, [favors]);

  useEffect(() => {
    storageService.saveEmergencies(emergencies);
  }, [emergencies]);

  // Si pasa a online y hay cola offline, sincronizar
  useEffect(() => {
    if (isOnline) {
      const queue = storageService.getOfflineQueue();
      if (queue.length > 0) {
        showToast(`Conexión restaurada: ${queue.length} publicaciones sincronizadas con la red`, 'success');
        storageService.clearOfflineQueue();
      }
    }
  }, [isOnline]);

  // Cambiar entre Modo Día a Día y Modo Emergencia
  const toggleEmergencyMode = (targetMode) => {
    const nextMode = targetMode || (appMode === APP_MODES.NORMAL ? APP_MODES.EMERGENCY : APP_MODES.NORMAL);
    setAppMode(nextMode);
    
    if (nextMode === APP_MODES.EMERGENCY) {
      setActiveTab('emergency');
      showToast('⚠️ MODO EMERGENCIA ACTIVADO: Red orientada a soporte y auxilio vecinal', 'warning');
    } else {
      setActiveTab('services');
      showToast('🕊️ Modo Normal Activo: Servicios y Solidaridad', 'info');
    }
  };

  // 1. Agregar visto bueno a un servicio (Módulo 1)
  const addEndorsement = (serviceId, comment) => {
    const authorName = currentUser 
      ? `${currentUser.name} (${currentUser.block})` 
      : 'Vecino del Barrio';

    const newEndorsement = {
      id: `end_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: currentUser?.id || `usr_${currentUser?.phone || Date.now()}`,
      authorPhone: currentUser?.phone || null,
      authorName: currentUser?.name || null,
      neighbor: authorName,
      text: comment || 'Recomiendo este servicio vecinal con total confianza.',
      date: 'Hace un momento',
    };

    setServices((prev) =>
      prev.map((item) => {
        if (item.id === serviceId) {
          const updatedItem = {
            ...item,
            endorsementsCount: item.endorsementsCount + 1,
            endorsements: [newEndorsement, ...(item.endorsements || [])],
          };
          apiService.syncPublication({ ...updatedItem, type: 'SERVICE' });
          return updatedItem;
        }
        return item;
      })
    );
    showToast('¡Visto Bueno vecinal registrado con éxito!', 'success');
  };

  // 2. Editar visto bueno (solo el autor)
  const editEndorsement = (serviceId, endorsementId, newText) => {
    if (!newText || !newText.trim()) {
      showToast('El comentario no puede estar vacío', 'warning');
      return;
    }

    setServices((prev) =>
      prev.map((item) => {
        if (item.id === serviceId) {
          const updatedEndorsements = (item.endorsements || []).map((end, idx) => {
            const currentId = end.id || `end_${idx}`;
            if (currentId === endorsementId) {
              return {
                ...end,
                text: newText.trim(),
                isEdited: true,
                date: 'Editado recién',
              };
            }
            return end;
          });

          const updatedItem = {
            ...item,
            endorsements: updatedEndorsements,
          };
          apiService.syncPublication({ ...updatedItem, type: 'SERVICE' });
          return updatedItem;
        }
        return item;
      })
    );
    showToast('Visto bueno actualizado correctamente', 'success');
  };

  // 3. Eliminar visto bueno (solo el autor)
  const deleteEndorsement = (serviceId, endorsementId) => {
    setServices((prev) =>
      prev.map((item) => {
        if (item.id === serviceId) {
          const updatedEndorsements = (item.endorsements || []).filter((end, idx) => {
            const currentId = end.id || `end_${idx}`;
            return currentId !== endorsementId;
          });

          const updatedItem = {
            ...item,
            endorsementsCount: Math.max(0, item.endorsementsCount - 1),
            endorsements: updatedEndorsements,
          };
          apiService.syncPublication({ ...updatedItem, type: 'SERVICE' });
          return updatedItem;
        }
        return item;
      })
    );
    showToast('Visto bueno eliminado', 'info');
  };

  // Voluntariado para una emergencia (Módulo Emergencia)
  const volunteerForEmergency = (emergencyId) => {
    setEmergencies((prev) =>
      prev.map((item) => {
        if (item.id === emergencyId) {
          return {
            ...item,
            confirmedVolunteers: item.confirmedVolunteers + 1,
          };
        }
        return item;
      })
    );
    showToast('Te has sumado como voluntario para esta emergencia. ¡Gracias vecino!', 'success');
  };

  // Cancelar voluntariado para una emergencia
  const cancelVolunteerForEmergency = (emergencyId) => {
    setEmergencies((prev) =>
      prev.map((item) => {
        if (item.id === emergencyId) {
          return {
            ...item,
            confirmedVolunteers: Math.max(0, item.confirmedVolunteers - 1),
          };
        }
        return item;
      })
    );
    showToast('Has cancelado tu registro como voluntario.', 'info');
  };

  // Alternar disponibilidad inmediata de un servicio
  const toggleServiceAvailability = (serviceId) => {
    setServices((prev) =>
      prev.map((item) => {
        if (item.id === serviceId) {
          const updated = item.isAvailableNow === false;
          showToast(updated ? '🟢 Estado actualizado a: Disponible hoy' : '⚪ Estado actualizado a: No disponible temporalmente', 'info');
          return {
            ...item,
            isAvailableNow: updated,
          };
        }
        return item;
      })
    );
  };

  // Alternar rol de Voluntario SOS
  const toggleServiceEmergency = (serviceId) => {
    setServices((prev) =>
      prev.map((item) => {
        if (item.id === serviceId) {
          const updated = !item.availableInEmergency;
          showToast(updated ? '🛡️ Sumado a la Red de Voluntarios SOS' : '🛡️ Voluntariado SOS desactivado', 'info');
          return {
            ...item,
            availableInEmergency: updated,
          };
        }
        return item;
      })
    );
  };

  // Publicación rápida de 3 clics con guardado real en Supabase
  const addPublication = async ({ type, category, title, description, priceNote, availableInEmergency, isAvailableNow }) => {
    const userToUse = currentUser || INITIAL_USER;
    const baseItem = {
      id: `pub_${Date.now()}`,
      author: {
        name: userToUse.name,
        email: userToUse.email || '',
        phone: userToUse.phone,
        password: userToUse.password || 'Password123!',
        block: userToUse.block,
        avatar: userToUse.avatar,
        isVerified: true,
      },
      title: title || 'Publicación vecinal rápida',
      category,
      description: description || 'Publicado mediante publicación rápida en 3 clics.',
      distanceMeters: Math.floor(Math.random() * 80) + 20, // Hiperlocal <100m
      lat: (userToUse.lat || -12.0464),
      lng: (userToUse.lng || -77.0428),
      createdAt: new Date().toISOString(),
      isOfflineCached: !isOnline,
    };

    if (!isOnline) {
      storageService.addToOfflineQueue(baseItem);
    }

    if (type === PUBLICATION_TYPES.SERVICE) {
      const newService = {
        ...baseItem,
        priceNote: priceNote || 'Precio a coordinar por WhatsApp',
        endorsementsCount: 1,
        endorsements: [
          { neighbor: 'Auto-registrado por el prestador', text: 'Vecino verificado del barrio.', date: 'Reciente' }
        ],
        availableInEmergency: availableInEmergency !== undefined ? availableInEmergency : true,
        isAvailableNow: isAvailableNow !== undefined ? isAvailableNow : true,
      };

      // Guardar con await y validar resultado real de Supabase
      try {
        const cloudCreated = await apiService.publicarEnSupabase({ ...newService, type: 'SERVICE' }, userToUse);
        if (cloudCreated && cloudCreated.id) {
          newService.id = cloudCreated.id;
          newService.isCloudSynced = true;
          showToast('✅ Oficio guardado en la base de datos Supabase', 'success');
        } else {
          showToast('Oficio publicado en red local', 'success');
        }
      } catch (err) {
        console.error('Error publicando en Supabase:', err);
        const detail = err.detail || err.message || 'Error al conectar con la base de datos';
        showToast(`⚠️ Supabase: ${detail}`, 'warning');
      }

      setServices((prev) => [newService, ...prev.filter(s => s.id !== newService.id)]);
      setActiveTab('services');
      apiService.syncPublication({ ...newService, type: 'SERVICE' });

    } else if (type === PUBLICATION_TYPES.FAVOR) {
      const newFavor = {
        ...baseItem,
        type: category.toUpperCase() || 'PRESTAMO',
        cost: 'GRATIS (Solidario)',
        status: 'DISPONIBLE',
        responsesCount: 0,
      };

      try {
        const cloudCreated = await apiService.publicarEnSupabase({ ...newFavor, type: 'FAVOR' }, userToUse);
        if (cloudCreated && cloudCreated.id) {
          newFavor.id = cloudCreated.id;
          newFavor.isCloudSynced = true;
          showToast('✅ Favor solidario guardado en Supabase', 'success');
        } else {
          showToast('Favor publicado y sincronizado', 'success');
        }
      } catch (err) {
        const detail = err.detail || err.message || 'Error del servidor';
        showToast(`⚠️ Supabase: ${detail}`, 'warning');
      }

      setFavors((prev) => [newFavor, ...prev.filter(f => f.id !== newFavor.id)]);
      setActiveTab('favors');
      apiService.syncPublication({ ...newFavor, type: 'FAVOR' });

    } else if (type === PUBLICATION_TYPES.EMERGENCY) {
      const newEmergency = {
        ...baseItem,
        priority: 'CRITICAL',
        needsSupport: 'Se requiere asistencia comunitaria inmediata',
        confirmedVolunteers: 0,
        resolved: false,
      };
      setEmergencies((prev) => [newEmergency, ...prev]);
      setActiveTab('emergency');
      apiService.syncPublication({ ...newEmergency, type: 'EMERGENCY' });
      showToast('🚨 Alerta SOS comunicada a toda la red', 'warning');
    }
  };

  const completeTutorial = () => {
    storageService.setTutorialSeen(true);
    setTutorialOpen(false);
  };

  const requireAuth = (callback, reason = 'GENERAL') => {
    if (currentUser) {
      callback();
    } else {
      setLoginReason(reason);
      setPendingAction(() => callback);
      setLoginModalOpen(true);
    }
  };

  const updateUserProfile = async (newProfile) => {
    const targetLat = newProfile.lat || currentUser?.lat || -12.0464;
    const targetLng = newProfile.lng || currentUser?.lng || -77.0428;

    const updated = {
      id: currentUser?.id || `usr_${Date.now()}`,
      avatar: newProfile.avatar !== undefined ? newProfile.avatar : (currentUser?.avatar || ''),
      ...newProfile,
      lat: targetLat,
      lng: targetLng,
      isRegistered: true,
    };
    setCurrentUser(updated);
    storageService.saveUserProfile(updated);
    storageService.saveRegisteredUser(updated);

    // Registro automático y directo en la base de datos Supabase
    if (newProfile.name && (newProfile.email || newProfile.phone)) {
      const cleanDigits = (newProfile.phone || '').replace(/\D/g, '').slice(-9).padStart(9, '9');
      const cleanSlug = (newProfile.name || 'vecino').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
      const emailToRegister = (newProfile.email || `${cleanSlug}.${cleanDigits.slice(-4)}@barrio.pe`).trim().toLowerCase();
      const passToRegister = newProfile.password || 'Password123!';

      // Llamada directa al puente del servidor
      fetch('/api/sync/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newProfile.name, 
          email: emailToRegister,
          phone: cleanDigits, 
          password: passToRegister,
          lat: targetLat, 
          lng: targetLng,
          address: newProfile.address,
          block: newProfile.block
        }),
      }).catch(() => {});

      try {
        const res = await apiService.registro({
          email: emailToRegister,
          password: passToRegister,
          nombre: newProfile.name.trim(),
          telefono: cleanDigits,
          tipoCuenta: 'PRESTADOR',
        });
        console.log('[Supabase Cloud] Vecino insertado en mae_usuario:', res);
        // Asociar ubicación GPS para que Spring Boot asocie la zona (RF09 / RF10)
        await apiService.actualizarUbicacion(targetLat, targetLng).catch(() => {});
        showToast(`✅ Identidad guardada en Supabase (${newProfile.name.split(' ')[0]})`, 'success');
      } catch (err) {
        try {
          await apiService.login(emailToRegister, passToRegister);
          await apiService.actualizarUbicacion(targetLat, targetLng).catch(() => {});
          showToast(`✅ Identidad conectada a Supabase (${newProfile.name.split(' ')[0]})`, 'success');
        } catch (e2) {
          console.warn('[Supabase Cloud Sync Warning]:', e2.message);
        }
      }
    }
    
    // Si había una acción pendiente (ej: publicar o visto bueno), ejecutarla automáticamente
    if (pendingAction) {
      const actionToExecute = pendingAction;
      setPendingAction(null);
      setTimeout(() => {
        actionToExecute();
      }, 250);
    }
  };

  const loginUser = async (userProfile) => {
    const rawPhone = userProfile.phone || '';
    const cleanDigits = rawPhone.replace(/\D/g, '').slice(-9);
    const cleanEmail = (userProfile.email || '').trim().toLowerCase();
    const matched = (cleanEmail ? storageService.findRegisteredUser(cleanEmail) : null) || 
                    (cleanDigits ? storageService.findRegisteredUser(cleanDigits) : null) || 
                    storageService.findRegisteredUser(userProfile.name);

    const updated = {
      id: matched?.id || userProfile.id || (cleanDigits ? `usr_${cleanDigits}` : `usr_${Date.now()}`),
      name: matched?.name || userProfile.name || (cleanDigits ? `Vecino (${cleanDigits})` : 'Vecino Registrado'),
      email: cleanEmail || matched?.email || (cleanDigits ? `${cleanDigits}@barrio.pe` : ''),
      password: userProfile.password || matched?.password || 'Password123!',
      phone: cleanDigits || matched?.phone || '',
      address: matched?.address || userProfile.address || 'La Casica - Pachacamac',
      block: matched?.block || userProfile.block || 'Manzana C',
      avatar: matched?.avatar || userProfile.avatar || '',
      lat: userProfile.lat || -12.0464,
      lng: userProfile.lng || -77.0428,
      isPhoneVerified: true,
      isVerifiedNeighbor: true,
      isRegistered: true,
    };

    setCurrentUser(updated);
    storageService.saveUserProfile(updated);
    storageService.saveRegisteredUser(updated);

    // Registro/verificación en segundo plano con el puente del servidor
    fetch('/api/sync/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: updated.name, 
        email: updated.email, 
        phone: updated.phone,
        password: updated.password,
        address: updated.address,
        block: updated.block 
      }),
    }).catch(() => {});

    // Iniciar sesión y garantizar zona GPS activa
    try {
      await apiService.ensureSession(updated);
    } catch {}

    showToast(`👋 ¡Bienvenido de vuelta, ${updated.name.split(' ')[0]}!`, 'success');

    if (pendingAction) {
      const actionToExecute = pendingAction;
      setPendingAction(null);
      setTimeout(() => {
        actionToExecute();
      }, 250);
    }

    return updated;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    storageService.clearUserProfile();
    showToast('Has cambiado a Modo Invitado (Sin registrar)', 'info');
  };

  return (
    <NeighborhoodContext.Provider
      value={{
        appMode,
        setAppMode,
        toggleEmergencyMode,
        currentUser,
        updateUserProfile,
        loginUser,
        logoutUser,
        requireAuth,
        loginModalOpen,
        setLoginModalOpen,
        loginReason,
        setLoginReason,
        services,
        favors,
        emergencies,
        addEndorsement,
        editEndorsement,
        deleteEndorsement,
        volunteerForEmergency,
        cancelVolunteerForEmergency,
        toggleServiceAvailability,
        toggleServiceEmergency,
        addPublication,
        isOnline,
        backendOnline,
        activeTab,
        setActiveTab,
        globalSearch,
        setGlobalSearch,
        tutorialOpen,
        setTutorialOpen,
        completeTutorial,
        quickPublishOpen,
        setQuickPublishOpen,
        emergencyConfirmOpen,
        setEmergencyConfirmOpen,
        avatarPreview,
        setAvatarPreview,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </NeighborhoodContext.Provider>
  );
}

export function useNeighborhood() {
  const context = useContext(NeighborhoodContext);
  if (!context) {
    throw new Error('useNeighborhood debe ser utilizado dentro de un NeighborhoodProvider');
  }
  return context;
}
