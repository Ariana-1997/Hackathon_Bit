import React, { useEffect, useRef, useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { APP_MODES } from '../../types';
import L from 'leaflet';
import { Layers, MapPin, Wrench, HeartHandshake, ShieldAlert, Navigation } from 'lucide-react';

export default function MapView() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const { 
    currentUser, 
    services, 
    favors, 
    emergencies, 
    appMode, 
    setActiveTab 
  } = useNeighborhood();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'SERVICES' | 'FAVORS' | 'EMERGENCIES'
  const isEmergency = appMode === APP_MODES.EMERGENCY;

  const userLat = currentUser?.lat || -12.0862;
  const userLng = currentUser?.lng || -77.0503;
  const userAddress = currentUser?.address || 'La Casica, Pachacamac';

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Evitar doble inicialización
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLat, userLng],
        zoom: 16,
        zoomControl: false,
      });

      // Añadir capa de OpenStreetMap (Gratuito y rápido)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Capa de marcadores
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Círculo de radio de proximidad caminable (~300 metros)
      L.circle([userLat, userLng], {
        color: isEmergency ? '#e11d48' : '#48739E',
        fillColor: isEmergency ? '#ffe4e6' : '#E4EDF5',
        fillOpacity: 0.25,
        radius: 300,
      }).addTo(map);

      // Marcador de "Tú estás aquí"
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="background-color: #0284c7; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<strong>Tu ubicación actual</strong><br/>${userAddress}`);
    }

    // Actualizar marcadores dinámicamente según filtros
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      // Pines de Servicios (Azul Acero Cívico)
      if (activeFilter === 'ALL' || activeFilter === 'SERVICES') {
        services.forEach((srv) => {
          if (srv.lat && srv.lng) {
            const icon = L.divIcon({
              className: 'srv-pin',
              html: `<div style="background:#48739E; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            L.marker([srv.lat, srv.lng], { icon })
              .addTo(markersLayerRef.current)
              .bindPopup(`
                <div style="font-size:12px; font-family:sans-serif; max-width:200px;">
                  <strong style="color:#2C4967;">${srv.title}</strong><br/>
                  <span>${srv.author.name}</span><br/>
                  <small style="color:#395E83; font-weight:bold;">A ${srv.distanceMeters}m de tu casa</small>
                </div>
              `);
          }
        });
      }

      // Pines de Favores Solidarios
      if (activeFilter === 'ALL' || activeFilter === 'FAVORS') {
        favors.forEach((fav) => {
          if (fav.lat && fav.lng) {
            const icon = L.divIcon({
              className: 'fav-pin',
              html: `<div style="background:#395E83; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.25);">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/></svg>
              </div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            L.marker([fav.lat, fav.lng], { icon })
              .addTo(markersLayerRef.current)
              .bindPopup(`
                <div style="font-size:12px; font-family:sans-serif; max-width:200px;">
                  <strong style="color:#1F344B;">${fav.title}</strong><br/>
                  <span>${fav.author.name}</span><br/>
                  <small style="color:#395E83; font-weight:bold;">A ${fav.distanceMeters}m • Solidario</small>
                </div>
              `);
          }
        });
      }

      // Pines de Emergencia (Rojo pulsante)
      if (activeFilter === 'ALL' || activeFilter === 'EMERGENCIES' || isEmergency) {
        emergencies.forEach((emg) => {
          if (emg.lat && emg.lng) {
            const icon = L.divIcon({
              className: 'emg-pin',
              html: `<div style="background:#e11d48; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 12px rgba(225,29,72,0.8);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });
            L.marker([emg.lat, emg.lng], { icon })
              .addTo(markersLayerRef.current)
              .bindPopup(`
                <div style="font-size:12px; font-family:sans-serif; max-width:200px;">
                  <strong style="color:#be123c;">${emg.title}</strong><br/>
                  <p style="margin:4px 0; color:#475569;">${emg.needsSupport}</p>
                  <small style="color:#e11d48; font-weight:bold;">A ${emg.distanceMeters}m • Auxilio necesario</small>
                </div>
              `);
          }
        });
      }
    }
  }, [currentUser, services, favors, emergencies, activeFilter, isEmergency]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const recenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLat, userLng], 16);
    }
  };

  return (
    <div className="space-y-3 pb-24 w-full max-w-2xl mx-auto px-4 pt-3 flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-6rem)]">
      
      {/* Map Control Filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1.5 overflow-x-auto text-xs py-0.5">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all active:scale-95 ${
              activeFilter === 'ALL' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('SERVICES')}
            className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 ${
              activeFilter === 'SERVICES' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Wrench className={`w-3.5 h-3.5 ${activeFilter === 'SERVICES' ? 'text-white stroke-[2.5]' : 'text-emerald-700 stroke-2'}`} />
            <span>Oficios</span>
          </button>
          <button
            onClick={() => setActiveFilter('FAVORS')}
            className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 ${
              activeFilter === 'FAVORS' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake className={`w-3.5 h-3.5 ${activeFilter === 'FAVORS' ? 'text-white stroke-[2.5]' : 'text-emerald-700 stroke-2'}`} />
            <span>Favores</span>
          </button>
          <button
            onClick={() => setActiveFilter('EMERGENCIES')}
            className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 ${
              activeFilter === 'EMERGENCIES' 
                ? 'bg-rose-600 text-white shadow-xs' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${activeFilter === 'EMERGENCIES' ? 'text-white stroke-[2.5]' : 'text-emerald-700 stroke-2'}`} />
            <span>SOS</span>
          </button>
        </div>

        {/* Recenter button */}
        <button
          onClick={recenterMap}
          className="p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 active:scale-95"
          title="Centrar en mi casa"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
        </button>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-200">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Floating Proximity Radius Legend */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur-sm p-2.5 rounded-2xl border border-slate-200/80 shadow-md text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-600"></span>
            <span className="font-semibold text-slate-700 text-[11px]">Radio de 300m caminable</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Toca los pines para ver detalles</span>
        </div>
      </div>

    </div>
  );
}
