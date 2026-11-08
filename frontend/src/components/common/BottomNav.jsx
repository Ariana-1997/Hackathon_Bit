import React from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { APP_MODES } from '../../types';
import { Home, Wrench, HeartHandshake, Plus, ShieldAlert } from 'lucide-react';

export default function BottomNav() {
  const { 
    activeTab, 
    setActiveTab, 
    setQuickPublishOpen,
    requireAuth,
    appMode,
    emergencies 
  } = useNeighborhood();

  const isEmergency = appMode === APP_MODES.EMERGENCY;
  const activeEmergenciesCount = emergencies.filter(e => !e.resolved).length;

  return (
    <nav className="fixed sm:absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-between relative">
        
        {/* Tab 1: Inicio */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'home'
              ? 'text-emerald-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Inicio</span>
        </button>

        {/* Tab 2: Oficios / Servicios Locales */}
        <button
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'services'
              ? 'text-emerald-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <Wrench className={`w-5 h-5 mb-0.5 ${activeTab === 'services' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Oficios</span>
        </button>

        {/* Central Floating Button: Quick Publish */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            onClick={() => requireAuth(() => setQuickPublishOpen(true), 'PUBLISH')}
            aria-label="Publicar"
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 hover:scale-105 text-white ${
              isEmergency
                ? 'bg-rose-600 shadow-md ring-4 ring-rose-100'
                : 'bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 shadow-emerald-700/30 ring-4 ring-emerald-100'
            }`}
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
          <span className="text-[10px] font-black text-slate-800 mt-1 tracking-tight">
            Publicar
          </span>
        </div>

        {/* Tab 3: Cadena de Favores / Solidaridad */}
        <button
          onClick={() => setActiveTab('favors')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 ${
            activeTab === 'favors'
              ? 'text-emerald-700 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <HeartHandshake className={`w-5 h-5 mb-0.5 ${activeTab === 'favors' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px]">Favores</span>
        </button>

        {/* Tab 4: SOS Emergencias */}
        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all active:scale-95 relative ${
            activeTab === 'emergency'
              ? 'text-rose-600 font-extrabold scale-105'
              : isEmergency
              ? 'text-rose-500 font-bold'
              : 'text-slate-400 hover:text-slate-700 font-semibold'
          }`}
        >
          <div className="relative">
            <ShieldAlert className={`w-5 h-5 mb-0.5 ${activeTab === 'emergency' || isEmergency ? 'stroke-[2.5] text-rose-600' : 'stroke-2'}`} />
            {activeEmergenciesCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse shadow-sm">
                {activeEmergenciesCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">SOS</span>
        </button>

      </div>
    </nav>
  );
}
