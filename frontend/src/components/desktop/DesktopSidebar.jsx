import React from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { APP_MODES } from '../../types';
import { getInitials } from '../../utils/userUtils';
import { 
  Home, Wrench, HeartHandshake, Plus, MapPin, ShieldAlert, 
  HelpCircle, WifiOff, Wifi, User, LogOut, CheckCircle2, LogIn 
} from 'lucide-react';

export default function DesktopSidebar() {
  const { 
    activeTab, 
    setActiveTab, 
    appMode, 
    toggleEmergencyMode, 
    currentUser, 
    setLoginModalOpen, 
    logoutUser,
    requireAuth, 
    setQuickPublishOpen, 
    setTutorialOpen,
    isOnline,
    backendOnline,
    emergencies 
  } = useNeighborhood();

  const isEmergency = appMode === APP_MODES.EMERGENCY;
  const activeEmergenciesCount = emergencies.filter(e => !e.resolved).length;

  return (
    <aside className="w-64 xl:w-72 shrink-0 flex flex-col justify-between py-6 h-[calc(100vh-3rem)] sticky top-6">
      
      <div className="space-y-6">
        {/* Brand & Neighborhood Logo */}
        <div className="flex items-center space-x-3 px-2">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md transition-all ${
            isEmergency 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-emerald-600 text-white'
          }`}>
            <HeartHandshake className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 leading-tight tracking-tight flex items-center space-x-1.5">
              <span>Red Vecinal</span>
            </h1>
            <div className="mt-1">
              {backendOnline ? (
                <div 
                  title="Backend en la Nube conectado (Spring Boot 3 + Supabase)"
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-300 text-[10px] font-black shadow-2xs"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>🟢 Nube Activa</span>
                </div>
              ) : (
                <div 
                  title="Sincronizando con Backend..."
                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>🟡 Conectando...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Profile Card (Just like Image 2 style) */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-xs">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center space-x-2.5 cursor-pointer group flex-1 mr-2"
              >
                <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-emerald-300 shadow-2xs bg-emerald-50">
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center font-black text-xs select-none">
                      {getInitials(currentUser.name)}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                    {currentUser.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {currentUser.block || 'Manzana C'}
                  </p>
                </div>
              </div>
              <button
                onClick={logoutUser}
                title="Cerrar sesión / Probar como Invitado"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                  Estás navegando como:
                </span>
                <span className="text-xs font-black text-slate-800">
                  Modo Invitado
                </span>
              </div>
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu (Pills with soft borders) */}
        <nav className="space-y-1.5">
          {/* Item 0: Inicio */}
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'home'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 translate-x-1'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'home' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
            }`}>
              Barrio
            </span>
          </button>

          {/* Item 1: Oficios */}
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'services'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 translate-x-1'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Wrench className="w-4 h-4" />
              <span>Directorio de Oficios</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'services' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
            }`}>
              Visto Bueno
            </span>
          </button>

          {/* Item 2: Favores */}
          <button
            onClick={() => setActiveTab('favors')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'favors'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 translate-x-1'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <HeartHandshake className="w-4 h-4" />
              <span>Cadena de Favores</span>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'favors' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              Cero Dinero
            </span>
          </button>

          {/* Item 3: Mapa */}
          <button
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'map'
                ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 translate-x-1'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4" />
              <span>Mapa de Proximidad</span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">300m</span>
          </button>

          {/* Item 4: Emergencia SOS */}
          <button
            onClick={() => setActiveTab('emergency')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'emergency' || isEmergency
                ? 'bg-rose-600 text-white translate-x-1'
                : 'text-rose-700 hover:bg-rose-50 hover:text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-4 h-4" />
              <span>Tablero SOS Crisis</span>
            </div>
            {activeEmergenciesCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {activeEmergenciesCount} alertas
              </span>
            )}
          </button>
        </nav>

        {/* Big 3-Click CTA Button (Prominent & Clear) */}
        <button
          onClick={() => requireAuth(() => setQuickPublishOpen(true), 'PUBLISH')}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2 ${
            isEmergency 
              ? 'bg-rose-600 hover:bg-rose-700' 
              : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 hover:from-emerald-800 hover:to-emerald-600 shadow-emerald-700/20'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Publicar en 3 Clics</span>
        </button>
      </div>

      {/* Footer controls: SOS Metamorphosis, Connectivity & Tutorial */}
      <div className="space-y-2 pt-4 border-t border-slate-200/80">
        
        {/* Switch de Metamorfosis a Emergencia */}
        <button
          onClick={() => toggleEmergencyMode()}
          className={`w-full py-2.5 px-3 rounded-2xl font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-2 ${
            isEmergency 
              ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' 
              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isEmergency ? 'Volver a Modo Normal' : 'Simular Alerta SOS'}</span>
        </button>

        {/* Status Pill: Offline / Tutorial */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-500 pt-1">
          <div className="flex items-center space-x-1.5 font-medium text-[11px]">
            {isOnline ? (
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-amber-400'} animate-pulse`}></span>
                <span className="font-bold text-slate-700">
                  {backendOnline ? '🟢 Nube Activa (Spring Boot 3)' : '🟡 Conectando a la nube...'}
                </span>
              </div>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-800 font-bold">Modo Offline Activo</span>
              </>
            )}
          </div>

          <button
            onClick={() => setTutorialOpen(true)}
            className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 font-semibold text-[11px]"
            title="Ver tutorial de uso"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ayuda</span>
          </button>
        </div>

      </div>

    </aside>
  );
}
