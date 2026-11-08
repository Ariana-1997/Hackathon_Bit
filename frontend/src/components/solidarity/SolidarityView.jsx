import React, { useState, useMemo } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import FavorCard from './FavorCard';
import { HeartHandshake, Plus, PenTool, Gift, Repeat, Car, Sparkles, HandHelping, MapPin } from 'lucide-react';

const SOLIDARITY_FILTERS = [
  { id: 'ALL', label: 'Todo el Muro' },
  { id: 'PRESTAMO', label: 'Herramientas', icon: PenTool },
  { id: 'DONACION', label: 'Donaciones', icon: Gift },
  { id: 'TRUEQUE', label: 'Habilidades', icon: Repeat },
  { id: 'AYUDA', label: 'Ayuda Temporal', icon: HandHelping },
];

export default function SolidarityView() {
  const { favors, setQuickPublishOpen, requireAuth, currentUser } = useNeighborhood();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const userName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Vecino';

  const filteredFavors = useMemo(() => {
    return favors.filter((fav) => {
      if (selectedFilter === 'ALL') return true;
      return fav.type === selectedFilter;
    }).sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }, [favors, selectedFilter]);

  return (
    <div className="space-y-4 pb-28 w-full max-w-2xl mx-auto px-4 pt-3.5">
      
      {/* Saludo limpio y humanizado */}
      <div className="px-1 pt-1">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Cadena de Favores
          </h2>
          <HeartHandshake className="w-6 h-6 text-emerald-700 stroke-[2.5]" />
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {SOLIDARITY_FILTERS.map((filter) => {
          const IconComp = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3.5 py-1.5 rounded-full font-extrabold whitespace-nowrap transition-all text-xs flex items-center space-x-1.5 border ${
                selectedFilter === filter.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {IconComp && <IconComp className="w-3.5 h-3.5" />}
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subheader: Proximity counter */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-700 pt-1">
        <span className="font-bold flex items-center text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 mr-1 shrink-0" />
          <span>{filteredFavors.length} favores disponibles a pie</span>
        </span>
      </div>

      {/* List of Favor Cards */}
      <div className="space-y-3.5">
        {filteredFavors.length > 0 ? (
          filteredFavors.map((favor) => (
            <FavorCard key={favor.id} favor={favor} />
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No hay publicaciones con este filtro</h4>
            <p className="text-xs text-slate-500">
              ¿Tienes una herramienta que no usas o necesitas una mano?
            </p>
            <button
              onClick={() => requireAuth(() => setQuickPublishOpen(true), 'PUBLISH')}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
            >
              Publicar un Favor Solidario
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
