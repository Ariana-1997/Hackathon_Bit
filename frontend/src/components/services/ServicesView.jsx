import React, { useState, useMemo } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { SERVICE_CATEGORIES } from '../../types';
import ServiceCard from './ServiceCard';
import { Search, MapPin, Sparkles, Plus, Heart, Wrench } from 'lucide-react';

export default function ServicesView() {
  const { services, setQuickPublishOpen, requireAuth, globalSearch, setGlobalSearch } = useNeighborhood();
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (globalSearch && ['gasfiteria', 'electricidad', 'cerrajeria', 'carpinteria'].includes(globalSearch.toLowerCase())) {
      return globalSearch.toLowerCase();
    }
    return 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    if (globalSearch && ['gasfiteria', 'electricidad', 'cerrajeria', 'carpinteria'].includes(globalSearch.toLowerCase())) {
      return '';
    }
    return globalSearch || '';
  });

  React.useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== '') {
      if (['gasfiteria', 'electricidad', 'cerrajeria', 'carpinteria'].includes(globalSearch.toLowerCase())) {
        setSelectedCategory(globalSearch.toLowerCase());
        setSearchQuery('');
      } else {
        setSearchQuery(globalSearch);
      }
    }
  }, [globalSearch]);

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchCategory = selectedCategory === 'ALL' || srv.category === selectedCategory;
      const matchSearch = 
        srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.author.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    }).sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }, [services, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 pb-28 w-full max-w-2xl mx-auto px-4 pt-3.5">
      
      {/* Search Input (Pill style, comfortable & clean) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar gasfitero, cerrajero, electricista..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-12 py-3 rounded-full bg-white border border-slate-200 text-xs shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[11px] text-slate-400 hover:text-slate-600 absolute right-4 top-1/2 -translate-y-1/2 font-bold px-1"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Categories Filter Pills (Inspired by the clean options in Image 1) */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-full font-extrabold whitespace-nowrap transition-all text-xs border ${
            selectedCategory === 'ALL'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
          }`}
        >
          Todos ({services.length})
        </button>
        {SERVICE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full font-extrabold whitespace-nowrap transition-all text-xs border ${
              selectedCategory === cat.id
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Subheader: Proximity counter */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-700 pt-1">
        <span className="font-bold flex items-center text-slate-800">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 mr-1 shrink-0" />
          <span>{filteredServices.length} oficios caminando a pie</span>
        </span>
      </div>

      {/* Service Cards Feed */}
      <div className="space-y-3.5">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No encontramos oficios con este filtro</h4>
            <p className="text-xs text-slate-500">
              ¿Eres vecino y ejerces este oficio en Pachacamac? Sé el primero en publicarlo.
            </p>
            <button
              onClick={() => requireAuth(() => setQuickPublishOpen(true), 'PUBLISH')}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
            >
              Publicar mi Oficio
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
