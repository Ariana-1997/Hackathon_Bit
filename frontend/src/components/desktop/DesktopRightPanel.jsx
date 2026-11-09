import React from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { APP_MODES } from '../../types';
import { 
  Phone, Shield, ShieldAlert, Heart, Users, CheckCircle2, 
  MapPin, Clock, ArrowRight, ExternalLink, Sparkles, AlertTriangle
} from 'lucide-react';

export default function DesktopRightPanel() {
  const { 
    appMode, 
    toggleEmergencyMode, 
    services, 
    favors, 
    emergencies, 
    currentUser, 
    setActiveTab 
  } = useNeighborhood();

  const isEmergency = appMode === APP_MODES.EMERGENCY;

  // Estadísticas en tiempo real
  const totalVerifiedEndorsements = services.reduce((acc, s) => acc + (s.endorsementsCount || 0), 0);
  const activeEmergencies = emergencies.filter(e => !e.resolved);

  return (
    <aside className="w-80 xl:w-96 shrink-0 flex flex-col space-y-5 py-6 h-[calc(100vh-3rem)] sticky top-6 overflow-y-auto pr-1">
      
      {/* 1. Radar de Proximidad / Mini Mapa Widget */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <MapPin className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 leading-tight">Radar de Proximidad</h3>
              <p className="text-[11px] text-slate-500">Radio vecinal ~300 metros</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            A pie (4 min)
          </span>
        </div>

        {/* Mini Preview Graphic */}
        <div 
          onClick={() => setActiveTab('map')}
          className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer group shadow-inner"
        >
          {/* Subtle stylized map pattern background */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#48739E_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Concentric proximity circles */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full border border-dashed border-emerald-400/60 bg-emerald-500/5 animate-pulse" />
            <div className="w-16 h-16 rounded-full border border-emerald-500/50 bg-emerald-500/10 absolute" />
          </div>

          {/* User pin */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          {/* Sample nearby neighbors pins */}
          <div className="absolute top-4 left-6 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-xs text-[10px] font-bold text-slate-700 border border-slate-200 flex items-center space-x-1">
            <span>🔧</span>
            <span>Don Pepe (80m)</span>
          </div>

          <div className="absolute bottom-5 right-6 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-xs text-[10px] font-bold text-slate-700 border border-slate-200 flex items-center space-x-1">
            <span>🤝</span>
            <span>Taladro Mz B (120m)</span>
          </div>

          {/* Hover overlay button */}
          <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-all flex items-end justify-center pb-2.5">
            <span className="text-[11px] font-extrabold text-emerald-800 group-hover:text-white bg-white/95 group-hover:bg-emerald-700 px-3 py-1 rounded-xl shadow-md transition-all flex items-center space-x-1">
              <span>Abrir Mapa Completo</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Tu ubicación: <strong>{currentUser?.block || 'Manzana C'}</strong></span>
          </span>
          <span className="text-emerald-700 font-bold">{currentUser?.address?.split('-')[0] || 'La Casica'}</span>
        </div>
      </div>

      {/* 2. Directorio Rápido de Emergencias y Serenazgo */}
      <div className={`rounded-3xl p-4 border transition-all ${
        isEmergency 
          ? 'bg-rose-950/40 border-rose-800 text-rose-100 shadow-md shadow-rose-900/20' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              isEmergency ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-100 text-rose-700'
            }`}>
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-xs font-black leading-tight ${isEmergency ? 'text-white' : 'text-slate-900'}`}>
                Centrales de Auxilio
              </h3>
              <p className={`text-[11px] ${isEmergency ? 'text-rose-300' : 'text-slate-500'}`}>
                Comunidad Vecinal
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            isEmergency ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            24 Horas
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Serenazgo */}
          <a
            href="tel:012311555"
            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-98 ${
              isEmergency 
                ? 'bg-rose-900/60 border-rose-700 hover:bg-rose-900 text-rose-100' 
                : 'bg-slate-50 border-slate-200/80 hover:bg-rose-50/60 hover:border-rose-300 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Shield className={`w-4 h-4 ${isEmergency ? 'text-rose-400' : 'text-rose-600'}`} />
              <div>
                <p className="font-bold text-[11px] leading-tight">Central de Seguridad Vecinal</p>
                <p className={`text-[10px] font-mono ${isEmergency ? 'text-rose-300' : 'text-slate-500'}`}>(01) 231-1555</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-white rounded-lg shadow-2xs text-rose-700 border border-rose-200">
              Llamar
            </span>
          </a>

          {/* Bomberos */}
          <a
            href="tel:116"
            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-98 ${
              isEmergency 
                ? 'bg-rose-900/60 border-rose-700 hover:bg-rose-900 text-rose-100' 
                : 'bg-slate-50 border-slate-200/80 hover:bg-rose-50/60 hover:border-rose-300 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span className="text-base">🚒</span>
              <div>
                <p className="font-bold text-[11px] leading-tight">Bomberos Voluntarios</p>
                <p className={`text-[10px] font-mono ${isEmergency ? 'text-rose-300' : 'text-slate-500'}`}>116 (Gratuito)</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-white rounded-lg shadow-2xs text-rose-700 border border-rose-200">
              Llamar
            </span>
          </a>

          {/* Policía Comisaría */}
          <a
            href="tel:105"
            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all active:scale-98 ${
              isEmergency 
                ? 'bg-rose-900/60 border-rose-700 hover:bg-rose-900 text-rose-100' 
                : 'bg-slate-50 border-slate-200/80 hover:bg-rose-50/60 hover:border-rose-300 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span className="text-base">👮</span>
              <div>
                <p className="font-bold text-[11px] leading-tight">Policía Nacional (105)</p>
                <p className={`text-[10px] font-mono ${isEmergency ? 'text-rose-300' : 'text-slate-500'}`}>Comisaría del distrito</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-1 bg-white rounded-lg shadow-2xs text-rose-700 border border-rose-200">
              Llamar
            </span>
          </a>
        </div>
      </div>

      {/* 3. Indicadores de Confianza Comunitaria (Impacto del Hackathon) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 leading-tight">Pulso de Confianza</h3>
              <p className="text-[11px] text-slate-500">Métricas de impacto vecinal</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <button 
            onClick={() => setActiveTab('services')}
            className="p-3 bg-slate-50 hover:bg-emerald-50/80 rounded-2xl border border-slate-200/60 transition-all text-center group cursor-pointer active:scale-95"
            title="Ver los oficios activos en el directorio"
          >
            <div className="text-lg font-black text-emerald-700 group-hover:scale-105 transition-transform">{services.length}</div>
            <div className="text-[10px] font-bold text-slate-700 mt-0.5">Oficios Activos</div>
            <div className="text-[9px] text-emerald-600 font-bold">Ver directorio →</div>
          </button>

          <button 
            onClick={() => setActiveTab('services')}
            className="p-3 bg-slate-50 hover:bg-emerald-50/80 rounded-2xl border border-slate-200/60 transition-all text-center group cursor-pointer active:scale-95"
            title="Ver recomendaciones de vecinos"
          >
            <div className="text-lg font-black text-emerald-700 group-hover:scale-105 transition-transform">{totalVerifiedEndorsements}</div>
            <div className="text-[10px] font-bold text-slate-700 mt-0.5">Vistos Buenos</div>
            <div className="text-[9px] text-emerald-600 font-bold">Validación social</div>
          </button>

          <button 
            onClick={() => setActiveTab('favors')}
            className="p-3 bg-slate-50 hover:bg-amber-50/80 rounded-2xl border border-slate-200/60 transition-all text-center group cursor-pointer active:scale-95"
            title="Ver favores solidarios sin dinero"
          >
            <div className="text-lg font-black text-amber-800 group-hover:scale-105 transition-transform">{favors.length}</div>
            <div className="text-[10px] font-bold text-slate-700 mt-0.5">Favores Solidarios</div>
            <div className="text-[9px] text-amber-700 font-bold">Ver muro →</div>
          </button>

          <button 
            onClick={() => setActiveTab('map')}
            className="p-3 bg-slate-50 hover:bg-amber-50/80 rounded-2xl border border-slate-200/60 transition-all text-center group cursor-pointer active:scale-95"
            title="Ver mapa con distancias caminables"
          >
            <div className="text-lg font-black text-amber-700 group-hover:scale-105 transition-transform">4 min</div>
            <div className="text-[10px] font-bold text-slate-700 mt-0.5">Tiempo a Pie</div>
            <div className="text-[9px] text-amber-600 font-bold">Ver en mapa →</div>
          </button>
        </div>
      </div>

      {/* 4. Hackathon Badge & Values */}
      <div className="p-3.5 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-3xl text-white shadow-sm text-xs space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-base">💡</span>
          <h4 className="font-extrabold text-[12px] leading-tight">Proyecto: Red Vecinal</h4>
        </div>
        <p className="text-[11px] text-emerald-100/90 leading-relaxed">
          Diseñado para funcionar <strong>sin contraseñas</strong>, con <strong>validación de confianza</strong> y <strong>resiliencia offline</strong> en la comunidad.
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 text-[10px] font-bold border border-emerald-700/60">
            PWA Offline
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 text-[10px] font-bold border border-emerald-700/60">
            3 Clics
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-200 text-[10px] font-bold border border-emerald-700/60">
            Radio 300m
          </span>
        </div>
      </div>

    </aside>
  );
}