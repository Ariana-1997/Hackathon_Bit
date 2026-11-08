import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_MODES, PUBLICATION_TYPES } from '../types';
import { INITIAL_USER, INITIAL_SERVICES, INITIAL_FAVORS, INITIAL_EMERGENCIES } from '../data/mockData';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const NeighborhoodContext = createContext(null);

export function NeighborhoodProvider({ children }) {
  const isOnline = useOnlineStatus();
  
  // Estado del modo de la app (NORMAL o EMERGENCY)
  const [appMode, setAppMode] = useState(() => storageService.getAppMode(APP_MODES.NORMAL));
  
  // Usuario actual persistido (null = Modo Visitante / Sin registrarse)
  const [currentUser, setCurrentUser] = useState(() => apiService.token ? storageService.getUserProfile(null) : null);

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

  // La información compartida se consulta exclusivamente a través de Spring Boot.
  // localStorage se utiliza solo como caché de lectura para preferencias/datos previamente cargados.
  useEffect(() => {
    let isMounted = true;

    const loadBackendData = async () => {
      if (!apiService.token) {
        return;
      }
      try {
        const [cloudServices, solidarityResponse, emergencyResponse] = await Promise.all([
          apiService.fetchCloudServices(),
          apiService.getSolidaridad({ page: 0, size: 50 }),
          apiService.getEmergencias(),
        ]);
        if (!isMounted) return;

        if (Array.isArray(cloudServices)) {
          setServices(cloudServices);
          storageService.saveServices(cloudServices);
        }

        const solidarityItems = solidarityResponse?.contenido || [];
        const mappedFavors = solidarityItems.map((item) => ({
          id: item.id,
          title: item.titulo,
          description: item.resumen || '',
          type: item.tipo,
          category: item.categoriaNombre || 'solidaridad',
          author: { name: item.autorNombre || 'Vecino' },
          lat: item.lat,
          lng: item.lng,
          createdAt: item.createdAt,
          status: item.estado,
        }));
        setFavors(mappedFavors);
        storageService.saveFavors(mappedFavors);

        const mappedEmergencies = (emergencyResponse || []).map((item) => ({
          id: item.id,
          title: item.tipo === 'ALERTA_EMERGENCIA' ? 'Alerta de emergencia' : 'Necesidad crítica',
          description: item.descripcion,
          priority: item.prioridad,
          resolved: item.estado === 'ATENDIDA' || item.estado === 'CERRADA',
          confirmedVolunteers: 0,
          lat: item.lat,
          lng: item.lng,
          createdAt: item.createdAt,
          author: { name: 'Vecino' },
        }));
        setEmergencies(mappedEmergencies);
        storageService.saveEmergencies(mappedEmergencies);
        setBackendOnline(true);
      } catch (error) {
        console.warn('No se pudo cargar la información desde Spring Boot:', error.message);
        if (isMounted) setBackendOnline(false);
      }
    };

    loadBackendData();
    const interval = setInterval(loadBackendData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

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

  // Publicación rápida: toda escritura se confirma en Spring Boot
  const addPublication = async ({ type, category, title, description, priceNote, availableInEmergency, isAvailableNow, address: customPubAddress }) => {
    if (!currentUser || !apiService.token) {
      showToast('Inicia sesión con una cuenta real para publicar.', 'warning');
      setLoginModalOpen(true);
      return;
    }
    if (!isOnline) {
      showToast('Sin conexión: la publicación no se envió. Inténtalo cuando vuelva internet.', 'warning');
      return;
    }
    const userToUse = currentUser;
    const finalLocation = customPubAddress || userToUse.address || userToUse.block || 'Pachacamac';
    const detectedBlock = finalLocation.match(/(?:Manzana|Mz\.?)\s*([A-Za-z0-9]+)/i);
    const authorBlock = detectedBlock ? `Manzana ${detectedBlock[1].toUpperCase()}` : (userToUse.block || finalLocation);

    const baseItem = {
      id: `pub_${Date.now()}`,
      address: finalLocation,
      author: {
        name: userToUse.name,
        email: userToUse.email || '',
        phone: userToUse.phone,
        address: finalLocation,
        block: authorBlock,
        avatar: userToUse.avatar,
        isVerified: true,
      },
      title: title || 'Publicación vecinal rápida',
      category,
      description: description || 'Publicado mediante publicación rápida en 3 clics.',
      distanceMeters: Math.floor(Math.random() * 80) + 20, // Hiperlocal <100m
      lat: userToUse.lat ?? null,
      lng: userToUse.lng ?? null,
      createdAt: new Date().toISOString(),
      isOfflineCached: !isOnline,
    };

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

      // Guardar mediante el backend y confirmar la respuesta
      try {
        const cloudCreated = await apiService.publicarEnBackend({ ...newService, type: 'SERVICE' }, userToUse);
        if (cloudCreated && cloudCreated.id) {
          newService.id = cloudCreated.id;
          newService.isCloudSynced = true;
          showToast('Oficio guardado mediante el backend.', 'success');
        } else {
          showToast('El backend no devolvió confirmación de guardado.', 'warning');
        }
      } catch (err) {
        console.error('Error publicando mediante Spring Boot:', err);
        const detail = err.detail || err.message || 'Error al conectar con la base de datos';
        showToast(`No se pudo guardar en el backend: ${detail}`, 'error');
        return;
      }

      setServices((prev) => [newService, ...prev.filter(s => s.id !== newService.id)]);
      setActiveTab('services');

    } else if (type === PUBLICATION_TYPES.FAVOR) {
      const newFavor = {
        ...baseItem,
        type: category.toUpperCase() || 'PRESTAMO',
        cost: 'GRATIS (Solidario)',
        status: 'DISPONIBLE',
        responsesCount: 0,
      };

      try {
        const cloudCreated = await apiService.publicarEnBackend({ ...newFavor, type: 'FAVOR' }, userToUse);
        if (cloudCreated && cloudCreated.id) {
          newFavor.id = cloudCreated.id;
          newFavor.isCloudSynced = true;
          showToast('Favor solidario guardado mediante el backend.', 'success');
        } else {
          showToast('El backend no devolvió confirmación de guardado.', 'warning');
        }
      } catch (err) {
        const detail = err.detail || err.message || 'Error del servidor';
        showToast(`No se pudo guardar en el backend: ${detail}`, 'error');
        return;
      }

      setFavors((prev) => [newFavor, ...prev.filter(f => f.id !== newFavor.id)]);
      setActiveTab('favors');

    } else if (type === PUBLICATION_TYPES.EMERGENCY) {
      if (baseItem.lat === null || baseItem.lng === null) {
        showToast('Selecciona tu ubicación antes de enviar una alerta SOS.', 'warning');
        return;
      }
      try {
        const catKey = (category || '').toString().toLowerCase().trim();
        // Mapeo a IDs de def_categoria (ámbito NECESIDAD: 13 a 21)
        const emergencyCatMap = {
          vulnerable: 21,          // CUIDADO_DEPENDIENTES
          primeros_auxilios: 18,   // ATENCION_MEDICA
          agua_alimento: 14,       // AGUA
          alimento: 13,            // ALIMENTOS
          medicamentos: 15,        // MEDICAMENTOS
          abrigo: 16,              // ABRIGO
          albergue: 17,            // ALBERGUE
          generador_luz: 17,       // ALBERGUE
          rescate: 20,             // TRANSPORTE_EMERGENCIA
        };
        const mappedCatId = emergencyCatMap[catKey] || (Number(category) >= 13 && Number(category) <= 21 ? Number(category) : 14);

        const created = await apiService.reportarEmergencia({
          tipo: 'ALERTA_EMERGENCIA',
          categoriaId: mappedCatId,
          descripcion: baseItem.description || baseItem.title || 'Alerta de auxilio vecinal',
          numeroPersonas: 1,
          lat: Number(baseItem.lat),
          lng: Number(baseItem.lng),
          anonimo: false,
          datosSensibles: null,
        });
        const newEmergency = {
          ...baseItem,
          ...created,
          title: 'Alerta de emergencia',
          priority: created.prioridad || 'CRITICAL',
          confirmedVolunteers: 0,
          resolved: false,
          author: { name: currentUser.name },
        };
        setEmergencies((prev) => [newEmergency, ...prev]);
        setActiveTab('emergency');
        showToast('Alerta SOS enviada y confirmada por el backend.', 'warning');
      } catch (err) {
        showToast(`No se pudo enviar la alerta SOS: ${err.message}`, 'error');
      }
    }
  };

  const completeTutorial = () => {
    storageService.setTutorialSeen(true);
    setTutorialOpen(false);
  };

  const requireAuth = (callback, reason = 'GENERAL') => {
    if (currentUser && apiService.token) {
      callback();
    } else {
      setLoginReason(reason);
      setPendingAction(() => callback);
      setLoginModalOpen(true);
    }
  };

  const updateUserProfile = async (newProfile) => {
    const targetLat = newProfile.lat ?? currentUser?.lat ?? null;
    const targetLng = newProfile.lng ?? currentUser?.lng ?? null;

    const submittedPassword = newProfile.password;
    const safeProfileInput = { ...newProfile };
    delete safeProfileInput.password;
    delete safeProfileInput.securityQuestions;

    // Caso 1: Actualización de perfil existente con sesión activa
    if (apiService.token) {
      try {
        const cleanPhone = (newProfile.phone || '').replace(/\D/g, '').slice(-9) || null;
        await apiService.actualizarPerfil(safeProfileInput.name, cleanPhone);
        if (targetLat !== null && targetLng !== null && Number.isFinite(Number(targetLat)) && Number.isFinite(Number(targetLng))) {
          await apiService.actualizarUbicacion(Number(targetLat), Number(targetLng));
        }

        const updated = {
          id: currentUser?.id || `usr_${Date.now()}`,
          avatar: newProfile.avatar !== undefined ? newProfile.avatar : (currentUser?.avatar || ''),
          ...safeProfileInput,
          phone: cleanPhone || '',
          lat: targetLat,
          lng: targetLng,
          isRegistered: true,
        };
        setCurrentUser(updated);
        storageService.saveUserProfile(updated);
        showToast('Perfil actualizado correctamente en el servidor.', 'success');
        return true;
      } catch (error) {
        showToast(`No se pudo actualizar el perfil: ${error.message}`, 'error');
        return false;
      }
    }

    // Caso 2: Nuevo registro de usuario con credenciales
    if (newProfile.email && submittedPassword) {
      try {
        const rawPhone = (newProfile.phone || '').replace(/\D/g, '').slice(-9);
        const cleanPhone = rawPhone.length === 9 ? rawPhone : null;

        await apiService.registro({
          email: newProfile.email.trim().toLowerCase(),
          password: submittedPassword,
          nombre: newProfile.name.trim(),
          telefono: cleanPhone,
        });

        const sesion = await apiService.login(newProfile.email.trim().toLowerCase(), submittedPassword);

        if (targetLat !== null && targetLng !== null && Number.isFinite(Number(targetLat)) && Number.isFinite(Number(targetLng))) {
          await apiService.actualizarUbicacion(Number(targetLat), Number(targetLng)).catch(() => {});
        }

        const updated = {
          id: sesion?.perfil?.id || `usr_${Date.now()}`,
          avatar: newProfile.avatar || '',
          ...safeProfileInput,
          phone: cleanPhone || '',
          lat: targetLat,
          lng: targetLng,
          isRegistered: true,
        };

        setCurrentUser(updated);
        storageService.saveUserProfile(updated);
        showToast('🎉 Cuenta creada y autenticada con éxito.', 'success');

        if (pendingAction) {
          const actionToExecute = pendingAction;
          setPendingAction(null);
          setTimeout(() => {
            actionToExecute();
          }, 250);
        }
        return true;
      } catch (error) {
        // En caso de fallo, NO marcar como registrado ni guardar en el navegador
        showToast(`Error al registrarse: ${error.message}`, 'error');
        return false;
      }
    }

    showToast('Completa correo y contraseña para crear tu cuenta.', 'warning');
    return false;
  };

  const loginUser = async (userProfile) => {
    if (!apiService.token) {
      throw new Error('La sesión no está autenticada por el backend.');
    }
    const profile = userProfile?.perfil || userProfile || {};
    const updated = {
      id: profile.id,
      name: profile.nombre || userProfile.name || 'Vecino',
      email: userProfile.email || '',
      phone: profile.telefono || userProfile.phone || '',
      address: '',
      block: profile.zona?.nombre || '',
      avatar: '',
      lat: profile.lat ?? null,
      lng: profile.lng ?? null,
      isPhoneVerified: false,
      isVerifiedNeighbor: true,
      isRegistered: true,
    };
    setCurrentUser(updated);
    storageService.saveUserProfile(updated);
    return updated;
  };

  const logoutUser = async () => {
    await apiService.logout();
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
