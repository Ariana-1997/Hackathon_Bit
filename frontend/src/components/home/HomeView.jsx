import React, { useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { 
  Search, Wrench, HeartHandshake, ShieldAlert, MapPin, 
  ArrowRight, Sparkles, Navigation, CheckCircle, MessageSquare
} from 'lucide-react';

export default function HomeView() {
  const { 
    setActiveTab, 
    setGlobalSearch, 
    currentUser,
    services,
    favors,
    emergencies
  } = useNeighborhood();

  const [inputSearch, setInputSearch] = useState('');

  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Vecino';
  const activeEmergenciesCount = emergencies.filter(e => !e.resolved).length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputSearch.trim()) {
      setActiveTab('services');
      return;
    }
    setGlobalSearch(inputSearch.trim());
    setActiveTab('services');
  };

  const handleQuickChip = (term, targetTab = 'services') => {
    setGlobalSearch(term);
    setActiveTab(targetTab);
  };

  return (
    <div className="space-y-4 pb-28 w-full max-w-2xl mx-auto px-4 pt-3.5 animate-fade-in">

      {/* 1. Cabecera de Bienvenida con Propósito Social */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>¡Hola, {userName}!</span>
            <span className="animate-wave inline-block select-none" role="img" aria-label="saludo">👋</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Bienvenido a <strong>Red Vecinal</strong>: la red comunitaria creada para conectar 
            oficios de confianza, ayuda solidaria y apoyo mutuo a la vuelta de tu casa.
          </p>
        </div>

        {/* Píldora de valor conservada */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold text-slate-700">
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
            Trato directo por WhatsApp
          </span>
        </div>
      </div>

      {/* 2. Buscador Puntual (Lo que busca el vecino en el momento) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center space-x-1.5">
          <Search className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            ¿Qué necesitas hoy en tu cuadra?
          </h3>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar gasfitero, cerrajero, escalera, agua..."
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs"
          >
            Buscar
          </button>
        </form>

        {/* Píldoras de palabras clave sugeridas */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold text-slate-500 mr-1">Populares:</span>
          <button
            type="button"
            onClick={() => handleQuickChip('gasfiteria', 'services')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 transition-colors"
          >
            🔧 Gasfitería
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('electricidad', 'services')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 transition-colors"
          >
            ⚡ Electricidad
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('cerrajeria', 'services')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 transition-colors"
          >
            🔑 Cerrajería
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('', 'favors')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 transition-colors"
          >
            🪜 Herramientas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emergency')}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            🚨 Auxilio SOS
          </button>
        </div>
      </div>

      {/* 3. ¿De qué trata este programa? (3 pilares en tarjetas visuales) */}
      <div className="space-y-2.5">
        <div className="px-1">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            ¿Cómo funciona el programa?
          </h3>
        </div>

        {/* Pilar 1: Oficios de Confianza */}
        <div 
          onClick={() => setActiveTab('services')}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors border border-emerald-300">
              <Wrench className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Trabajo y Oficios
                </span>
                <span className="text-xs text-emerald-800 font-extrabold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Ver oficios <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                Oficios de confianza en tu manzana
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Técnicos y especialistas de confianza a pasos de tu casa.
              </p>
            </div>
          </div>
        </div>

        {/* Pilar 2: Cadena de Favores (Sin dinero) */}
        <div 
          onClick={() => setActiveTab('favors')}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors border border-emerald-300">
              <HeartHandshake className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Solidario • Cero Dinero
                </span>
                <span className="text-xs text-emerald-800 font-extrabold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Ver favores <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                Cadena de favores y préstamos
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Préstamo de herramientas y ayuda mutua sin gastar dinero.
              </p>
            </div>
          </div>
        </div>

        {/* Pilar 3: Red de Auxilio SOS */}
        <div 
          onClick={() => setActiveTab('emergency')}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-rose-300 hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors border border-rose-300">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {activeEmergenciesCount > 0 ? `${activeEmergenciesCount} Alertas Activas` : 'Red de Auxilio Barrial'}
                </span>
                <span className="text-xs text-rose-600 font-extrabold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Ver red SOS <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 mt-1 leading-snug">
                Apoyo coordinado ante emergencias
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Alertas inmediatas y auxilio rápido ante cualquier urgencia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Acceso Rápido al Mapa */}
      <div 
        onClick={() => setActiveTab('map')}
        className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center font-bold text-white shrink-0 border border-white/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm leading-tight text-white">
              Mapa barrial interactivo
            </h4>
            <p className="text-xs text-blue-100 mt-0.5">
              Explora en el mapa los oficios y recursos a menos de 300 metros.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-white shrink-0 ml-2" />
      </div>

    </div>
  );
}
