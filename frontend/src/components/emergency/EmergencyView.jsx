import React, { useState, useMemo } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import EmergencyCard from './EmergencyCard';
import { 
  ShieldAlert, AlertTriangle, Droplets, Activity, 
  HeartHandshake, Plus, PhoneCall, CheckCircle, Wrench 
} from 'lucide-react';

const EMERGENCY_FILTERS = [
  { id: 'ALL', label: 'Todas las Alertas' },
  { id: 'vulnerable', label: 'Adultos Vulnerables', icon: HeartHandshake },
  { id: 'primeros_auxilios', label: 'Salud / Botiquín', icon: Activity },
  { id: 'agua_alimento', label: 'Agua / Cisternas', icon: Droplets },
];

export default function EmergencyView() {
  const { emergencies, services, setQuickPublishOpen, requireAuth } = useNeighborhood();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filteredEmergencies = useMemo(() => {
    return emergencies.filter((emg) => {
      if (selectedFilter === 'ALL') return true;
      return emg.category === selectedFilter;
    }).sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }, [emergencies, selectedFilter]);

  // Oficios disponibles para emergencias (Gasfiteros, Electricistas para reconectar tuberías o generadores)
  const emergencyResponders = services.filter(s => s.availableInEmergency);

  return (
    <div className="space-y-4 pb-24 w-full max-w-2xl mx-auto px-4 pt-3">
      
      {/* Encabezado limpio: Red de Soporte y Auxilio Inmediato */}
      <div className="px-1 pt-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Red de Soporte y Auxilio Inmediato
          </h2>
          <ShieldAlert className="w-5 h-5 text-rose-600 stroke-[2.5]" />
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-snug">
          Prioridad a personas en riesgo y recursos críticos. Coordinación directa sin intermediarios.
        </p>
      </div>

      {/* Botón de Emergencia Directa SOS */}
      <button
        onClick={() => requireAuth(() => setQuickPublishOpen(true), 'EMERGENCY')}
        className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center space-x-2 transition-all shadow-xs"
      >
        <ShieldAlert className="w-5 h-5" />
        <span>SOLICITAR AUXILIO</span>
      </button>

      {/* Filter pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {EMERGENCY_FILTERS.map((filter) => {
          const IconComp = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all text-xs flex items-center space-x-1 ${
                selectedFilter === filter.id
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-rose-50'
              }`}
            >
              {IconComp && <IconComp className="w-3.5 h-3.5 mr-1" />}
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feed of Critical Emergency Reports */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Reportes Vecinales Activos ({filteredEmergencies.length})
        </h3>
        
        {filteredEmergencies.map((emg) => (
          <EmergencyCard key={emg.id} emergency={emg} />
        ))}
      </div>

      {/* Emergency Volunteers / Professional Responders Section */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm mt-6">
        <div className="flex items-center space-x-2 mb-3">
          <Wrench className="w-4 h-4 text-emerald-700" />
          <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
            Vecinos con Oficios Críticos de Respuesta Inmediata
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 mb-3 leading-snug">
          Profesionales del barrio listos para reparar tuberías rotas, líneas de luz o accesos bloqueados:
        </p>

        <div className="space-y-2">
          {emergencyResponders.map((resp) => (
            <div key={resp.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">{resp.author.name}</span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {resp.emergencySkill || resp.title} ({resp.author.block})
                </span>
              </div>
              <a
                href={`tel:${resp.author.phone}`}
                className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center hover:bg-emerald-700 transition-colors"
              >
                <PhoneCall className="w-3 h-3 mr-1" />
                Llamar
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
