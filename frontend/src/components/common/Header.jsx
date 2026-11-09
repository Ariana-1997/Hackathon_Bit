import React from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { APP_MODES } from '../../types';
import { HelpCircle, WifiOff, AlertTriangle, User, HeartHandshake, LogIn } from 'lucide-react';
import { getInitials } from '../../utils/userUtils';

export default function Header() {
  const { 
    appMode, 
    toggleEmergencyMode, 
    isOnline, 
    backendOnline,
    setTutorialOpen,
    currentUser,
    setLoginModalOpen
  } = useNeighborhood();

  const isEmergency = appMode === APP_MODES.EMERGENCY;

  return (
    <header className={`sticky top-0 z-30 transition-all duration-300 backdrop-blur-md border-b shadow-sm ${
      isEmergency 
        ? 'bg-rose-900/95 text-white border-rose-800' 
        : 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-white border-emerald-900/40'
    }`}>
      {/* Top status bar */}
      <div className="max-w-md mx-auto px-3.5 py-2.5 flex items-center justify-between">
        
        {/* Left: User Identity Pill (Clean & Touch-friendly like Image 1) */}
        <button
          onClick={() => setLoginModalOpen(true)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 border ${
            currentUser 
              ? 'bg-white/15 hover:bg-white/25 text-white border-white/25' 
              : 'bg-white hover:bg-slate-100 text-[#2C4967] font-black border-white shadow-sm animate-soft-pulse'
          }`}
          title={currentUser ? "Tu Identidad Vecinal" : "Iniciar Sesión"}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30 shrink-0">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
            ) : currentUser?.name ? (
              <span className="text-[9px] font-black text-white leading-none">
                {getInitials(currentUser.name)}
              </span>
            ) : (
              <LogIn className="w-3.5 h-3.5 text-[#2C4967]" />
            )}
          </div>
          <span className="font-bold text-[11px] max-w-[90px] truncate">
            {currentUser?.name ? currentUser.name.split(' ')[0] : 'Iniciar Sesión'}
          </span>
        </button>

        {/* Center: Brand & Neighborhood Identity */}
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
              isEmergency ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-[#2C4967] shadow-xs'
            }`}>
              <HeartHandshake className={`w-3 h-3 ${isEmergency ? 'text-white' : 'text-[#2C4967]'} stroke-[2.5]`} />
            </div>
            <h1 className="font-extrabold text-sm tracking-tight leading-none text-white">
              Red Vecinal
            </h1>
          </div>
        </div>

        {/* Right: Actions (Tutorial & SOS Pill) */}
        <div className="flex items-center space-x-1.5">
          {/* Cloud API connected badge */}
          {backendOnline ? (
            <div 
              title="Backend en la Nube conectado (Spring Boot 3 + Supabase)"
              className="px-2.5 py-1 bg-green-500/20 border border-green-400/60 text-green-300 rounded-full text-[10px] font-extrabold flex items-center space-x-1.5 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span>Nube</span>
            </div>
          ) : (
            <div 
              title="Sincronizando con Backend en la Nube..."
              className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded-full text-[9px] font-bold flex items-center space-x-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Conectando...</span>
            </div>
          )}

          {/* Offline indicator badge if disconnected */}
          {!isOnline && (
            <div 
              title="Modo Offline activo"
              className="px-2 py-1 bg-amber-500 text-amber-950 rounded-full text-[10px] font-black flex items-center space-x-1 animate-pulse"
            >
              <WifiOff className="w-3 h-3" />
            </div>
          )}

          {/* Tutorial Help Button */}
          <button
            onClick={() => setTutorialOpen(true)}
            title="Cómo funciona la app"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all border border-white/10"
            aria-label="Ayuda y tutorial"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Emergency Mode Banner (When crisis active) */}
      {isEmergency && (
        <div className="bg-rose-900/95 px-4 py-2 text-xs flex items-center justify-between text-rose-100 border-t border-rose-800/80 animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            <span><strong>RED DE AUXILIO ACTIVA:</strong> Coordinación comunitaria inmediata</span>
          </div>
          <button
            onClick={() => toggleEmergencyMode(APP_MODES.NORMAL)}
            className="text-[11px] text-amber-300 underline font-extrabold shrink-0 ml-2 hover:text-white"
          >
            Volver a Normal
          </button>
        </div>
      )}
    </header>
  );
}
