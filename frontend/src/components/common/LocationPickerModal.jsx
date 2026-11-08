import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { geolocationService } from '../../services/geolocationService';
import { 
  X, 
  MapPin, 
  Navigation, 
  Check, 
  Crosshair, 
  Plus, 
  Minus, 
  Compass, 
  Building2, 
  Loader2 
} from 'lucide-react';

// Atajos vecinales rápidos para Pachacámac y alrededores
const NEIGHBORHOOD_PRESETS = [
  { label: 'La Casica (Mz C)', lat: -12.0862, lng: -77.0503, address: 'La Casica, Mz C - Pachacamac' },
  { label: 'Pachacamac Centro', lat: -12.2289, lng: -76.8586, address: 'Plaza de Armas, Pachacamac' },
  { label: 'Manzana A (Doña Rosa)', lat: -12.0855, lng: -77.0495, address: 'Manzana A, Pachacamac' },
  { label: 'Manzana B (Carlos M.)', lat: -12.0870, lng: -77.0515, address: 'Manzana B, Pachacamac' },
  { label: 'Av. Manuel Valle', lat: -12.2215, lng: -76.8650, address: 'Av. Manuel Valle, Pachacamac' },
];

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialCoords,
  initialAddress = '',
  onConfirm,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Coordenadas iniciales (Pachacámac por defecto si no vienen dadas)
  const defaultLat = initialCoords?.lat || -12.0862;
  const defaultLng = initialCoords?.lng || -77.0503;

  const [currentCoords, setCurrentCoords] = useState({ lat: defaultLat, lng: defaultLng });
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || 'Pachacamac, Lima');
  const [houseReference, setHouseReference] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const geocodeTimeoutRef = useRef(null);

  // Inicialización de mapa de Leaflet
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Destruir mapa previo si existía
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 17,
        zoomControl: false,
      });

      // Capa base de OpenStreetMap rápida y ligera
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Eventos de movimiento estilo inDrive
      map.on('movestart', () => {
        setIsMoving(true);
      });

      map.on('move', () => {
        const center = map.getCenter();
        setCurrentCoords({ lat: center.lat, lng: center.lng });
      });

      map.on('moveend', () => {
        setIsMoving(false);
        const center = map.getCenter();
        const lat = center.lat;
        const lng = center.lng;
        setCurrentCoords({ lat, lng });
        reverseGeocode(lat, lng);
      });

      // Permitir hacer click en cualquier parte del mapa para centrar allí
      map.on('click', (e) => {
        map.panTo(e.latlng, { animate: true, duration: 0.5 });
      });

      mapInstanceRef.current = map;

      // Forzar ajuste de tamaño por si el modal se abrió con animación
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      // Primera geocodificación si no hay dirección previa
      if (!initialAddress) {
        reverseGeocode(currentCoords.lat, currentCoords.lng);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Geocodificación inversa con OpenStreetMap Nominatim
  const reverseGeocode = (lat, lng) => {
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsGeocoding(true);

    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: { 'Accept-Language': 'es' },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          
          // Extraer componentes relevantes (calle, manzana, barrio, distrito)
          const road = addr.road || addr.pedestrian || addr.footway || '';
          const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || '';
          const cityDistrict = addr.city_district || addr.district || addr.suburb || 'Pachacamac';
          
          let builtAddress = '';
          if (road && neighborhood) {
            builtAddress = `${road}, ${neighborhood}`;
          } else if (road) {
            builtAddress = `${road}, ${cityDistrict}`;
          } else if (neighborhood) {
            builtAddress = `${neighborhood}, ${cityDistrict}`;
          } else if (data.display_name) {
            // Tomar las primeras dos partes del display_name
            builtAddress = data.display_name.split(',').slice(0, 2).join(', ').trim();
          }

          if (builtAddress) {
            setSelectedAddress(builtAddress);
          } else {
            setSelectedAddress(`Ubicación en ${cityDistrict}`);
          }
        } else {
          fallbackAddress(lat, lng);
        }
      } catch (err) {
        fallbackAddress(lat, lng);
      } finally {
        setIsGeocoding(false);
      }
    }, 600);
  };

  const fallbackAddress = (lat, lng) => {
    // Si no hay red, construir dirección representativa
    setSelectedAddress(`Sector Pachacamac (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  // Centrar en ubicación GPS real del celular/navegador
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        geolocationService.saveLastPosition(lat, lng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
        }
        setCurrentCoords({ lat, lng });
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocatingGps(false);
        console.warn('GPS error, using fallback:', err.message);
        // Volar a la última ubicación GPS conocida; si no hay, a Pachacámac Centro
        const last = geolocationService.getLastPosition();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(
            last ? [last.lat, last.lng] : [-12.0862, -77.0503],
            17,
            { duration: 1 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Volar a un atajo barrial predefinido
  const handleSelectPreset = (preset) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 17, { duration: 1 });
    }
    setCurrentCoords({ lat: preset.lat, lng: preset.lng });
    setSelectedAddress(preset.address);
  };

  // Zoom controles manuales
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Confirmar y guardar la ubicación elegida
  const handleConfirmLocation = () => {
    let finalAddress = selectedAddress.trim();
    if (houseReference.trim()) {
      finalAddress = `${finalAddress} (${houseReference.trim()})`;
    }

    onConfirm({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      address: finalAddress,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* ======================================================== */}
        {/* 1. CABECERA ESTILO INDRIVE / UBER */}
        {/* ======================================================== */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Elige tu ubicación exacta
              </h3>
              <p className="text-[11px] text-slate-500">
                Mueve el mapa para colocar el pin en tu casa o cuadra
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* 2. BARRA DE ATAJOS BARRIALES */}
        {/* ======================================================== */}
        <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-200/60 overflow-x-auto no-scrollbar flex items-center space-x-1.5 z-20 shrink-0 text-xs">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Building2 className="w-3 h-3 text-slate-600" />
            Zonas:
          </span>

          <button
            type="button"
            onClick={handleLocateMe}
            className="px-2.5 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-[11px] flex items-center space-x-1 shrink-0 transition-colors shadow-2xs cursor-pointer"
          >
            <Crosshair className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
            <span>Mi GPS actual</span>
          </button>

          {NEIGHBORHOOD_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold shrink-0 transition-colors cursor-pointer shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* 3. CONTENEDOR DEL MAPA INTERACTIVO */}
        {/* ======================================================== */}
        <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
          {/* Contenedor DOM para Leaflet */}
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* ======================================================== */}
          {/* PIN FLOTANTE CENTRAL ESTILO INDRIVE */}
          {/* ======================================================== */}
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            <div className="relative flex flex-col items-center select-none">
              
              {/* Etiqueta flotante sobre el pin */}
              <div 
                className={`mb-1 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-bold shadow-lg flex items-center space-x-1.5 transition-all duration-200 ${
                  isMoving ? 'opacity-0 scale-90 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
                }`}
              >
                <span>Fijar aquí</span>
              </div>

              {/* Icono del Pin estilo inDrive con animación al mover */}
              <div 
                className={`transition-transform duration-200 ease-out origin-bottom ${
                  isMoving ? '-translate-y-4 scale-110' : 'translate-y-0 scale-100'
                }`}
              >
                <div className="relative">
                  {/* Pin SVG personalizado de alta visibilidad */}
                  <svg 
                    viewBox="0 0 384 512" 
                    className="w-10 h-10 drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]"
                  >
                    {/* Cuerpo del Pin azul inDrive / Uber */}
                    <path 
                      fill="#2563eb" 
                      d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0z" 
                    />
                    {/* Aro blanco interior */}
                    <circle cx="192" cy="192" r="84" fill="#ffffff" />
                    {/* Centro azul */}
                    <circle cx="192" cy="192" r="48" fill="#1d4ed8" />
                  </svg>
                </div>
              </div>

              {/* Sombra en el suelo que reacciona a la elevación del pin */}
              <div 
                className={`w-4 h-1.5 bg-black/35 rounded-full blur-[1px] transition-all duration-200 -mt-1 ${
                  isMoving ? 'scale-50 opacity-40' : 'scale-100 opacity-80'
                }`}
              />

              {/* Punto exacto en el suelo */}
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-white -mt-1" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* BOTONES FLOTANTES SOBRE EL MAPA (GPS y ZOOM) */}
          {/* ======================================================== */}
          <div className="absolute right-3.5 bottom-6 z-30 flex flex-col space-y-2">
            {/* Botón Mi Ubicación Actual */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingGps}
              title="Centrar en mi GPS actual"
              className="w-11 h-11 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 shadow-md border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <Navigation className={`w-5 h-5 text-blue-600 ${isLocatingGps ? 'animate-spin' : ''}`} />
            </button>

            {/* Controles de Zoom */}
            <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden flex flex-col">
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-11 h-10 hover:bg-slate-50 text-slate-700 flex items-center justify-center border-b border-slate-100 active:bg-slate-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-11 h-10 hover:bg-slate-50 text-slate-700 flex items-center justify-center active:bg-slate-100 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. PANEL INFERIOR / DRAWER DE CONFIRMACIÓN */}
        {/* ======================================================== */}
        <div className="p-4 bg-white border-t border-slate-200 shadow-xl z-20 shrink-0 space-y-3">
          
          {/* Tarjeta de Dirección Detectada */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Ubicación elegida en el mapa
                </span>
                {isGeocoding && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    Detectando calle...
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
                {selectedAddress}
              </h4>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Campo opcional de referencia para el vecino */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Referencia / Lote / N° de Casa:
            </label>
            <input
              type="text"
              placeholder="Ej: Mz C Lote 4, Frente a la bodega (opcional)"
              value={houseReference}
              onChange={(e) => setHouseReference(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Botón Principal de Confirmación */}
          <button
            type="button"
            onClick={handleConfirmLocation}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Confirmar esta ubicación</span>
          </button>
        </div>

      </div>
    </div>
  );
}
