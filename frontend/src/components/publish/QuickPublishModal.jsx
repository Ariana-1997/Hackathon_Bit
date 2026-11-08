import React, { useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { PUBLICATION_TYPES, SERVICE_CATEGORIES, FAVOR_CATEGORIES, EMERGENCY_CATEGORIES } from '../../types';
import { 
  X, Check, MapPin, Zap, Wrench, Key, Hammer, Dog, BookOpen, Scissors, 
  Briefcase, PenTool, HandHelping, Gift, Repeat, Car, HeartHandshake, 
  Activity, Droplets, ZapOff, ShieldAlert, Sparkles, Navigation, ArrowLeft 
} from 'lucide-react';

// Mapeo seguro de iconos
const ICON_MAP = {
  Wrench, Zap, Key, Hammer, Dog, BookOpen, Scissors, Briefcase,
  PenTool, HandHelping, Gift, Repeat, Car, HeartHandshake,
  Activity, Droplets, ZapOff, ShieldAlert,
};

export default function QuickPublishModal() {
  const { 
    quickPublishOpen, 
    setQuickPublishOpen, 
    addPublication,
    currentUser,
    isOnline
  } = useNeighborhood();

  // Estados del flujo de 3 clics
  const [clickCount, setClickCount] = useState(0);
  const [step, setStep] = useState(1); // 1: Tipo, 2: Categoría/Plantilla, 3: Confirmación de Ubicación

  // Selección
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customNote, setCustomNote] = useState('');

  if (!quickPublishOpen) return null;

  const handleClose = () => {
    setQuickPublishOpen(false);
    setStep(1);
    setClickCount(0);
    setSelectedType(null);
    setSelectedCategory(null);
    setCustomNote('');
  };

  // CLIC 1: Selección del Tipo de Publicación
  const handleSelectType = (type) => {
    setSelectedType(type);
    setClickCount(1);
    setStep(2);
  };

  // CLIC 2: Selección de la Categoría / Plantilla
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setClickCount(2);
    setStep(3);
  };

  // CLIC 3: Confirmación y Publicación en la ubicación actual
  const handleFinalPublish = () => {
    let finalTitle = selectedCategory?.label || 'Publicación vecinal';
    let defaultDesc = '';

    if (selectedType === PUBLICATION_TYPES.SERVICE) {
      if (selectedCategory?.id === 'otros' && customNote.trim()) {
        finalTitle = customNote.trim();
        defaultDesc = `Ofrezco mis servicios de ${customNote.trim()} a vecinos cercanos en Pachacamac. Sin costo de traslado.`;
      } else if (customNote.trim()) {
        finalTitle = `${selectedCategory.label}: ${customNote.trim()}`;
        defaultDesc = `Ofrezco mis servicios en ${selectedCategory.label} a vecinos cercanos en Pachacamac. Sin costo de traslado.`;
      } else {
        defaultDesc = `Ofrezco mis servicios en ${selectedCategory.label} a vecinos cercanos en Pachacamac. Sin costo de traslado.`;
      }
    } else if (selectedType === PUBLICATION_TYPES.FAVOR) {
      if (customNote.trim()) {
        finalTitle = customNote.trim();
      }
      defaultDesc = `Disponible para la comunidad: ${selectedCategory.label}. Coordinemos por aquí o WhatsApp.`;
    } else if (selectedType === PUBLICATION_TYPES.EMERGENCY) {
      if (customNote.trim()) {
        finalTitle = customNote.trim();
      }
      defaultDesc = `Alerta comunitaria: ${selectedCategory.label}. Se requiere soporte coordinado.`;
    }

    addPublication({
      type: selectedType,
      category: selectedCategory?.id || 'otros',
      title: finalTitle,
      description: defaultDesc,
    });

    handleClose();
  };

  const getCategoriesForType = () => {
    if (selectedType === PUBLICATION_TYPES.SERVICE) return SERVICE_CATEGORIES;
    if (selectedType === PUBLICATION_TYPES.FAVOR) return FAVOR_CATEGORIES;
    if (selectedType === PUBLICATION_TYPES.EMERGENCY) return EMERGENCY_CATEGORIES;
    return [];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header estilo Image 2 (Verde esmeralda, limpio y humanizado) */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
              {clickCount}/3
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight">
                Publicación Rápida
              </h3>
              <p className="text-[11px] text-emerald-200">
                {step === 1 && 'Paso 1: ¿Qué vas a publicar?'}
                {step === 2 && 'Paso 2: Elige la categoría con 1 toque'}
                {step === 3 && 'Paso 3: Confirmar y publicar'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-emerald-900/70 border border-emerald-700/80 text-emerald-200 px-2.5 py-1 rounded-full font-bold">
              3 Clics
            </span>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3.5">

          {/* PASO 1 (CLIC 1): ¿QUÉ VAS A PUBLICAR? */}
          {step === 1 && (
            <div className="space-y-3 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-xs text-emerald-900 leading-snug">
                Selecciona la opción con <strong>un solo toque</strong> para avanzar:
              </div>

              {/* Botón 1: Oficio Local (Pill card estilo Image 1) */}
              <button
                onClick={() => handleSelectType(PUBLICATION_TYPES.SERVICE)}
                className="w-full p-4 rounded-2xl border-2 border-slate-200/90 hover:border-emerald-500 hover:bg-emerald-50/50 active:scale-[0.98] transition-all flex items-center space-x-3.5 text-left group bg-white shadow-xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                  <Wrench className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Ofrecer un Oficio o Servicio</h4>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">
                    Gasfitería, cerrajería, electricidad, clases, paseos con Visto Bueno.
                  </p>
                </div>
              </button>

              {/* Botón 2: Favor Solidario */}
              <button
                onClick={() => handleSelectType(PUBLICATION_TYPES.FAVOR)}
                className="w-full p-4 rounded-2xl border-2 border-slate-200/90 hover:border-emerald-600 hover:bg-emerald-50/50 active:scale-[0.98] transition-all flex items-center space-x-3.5 text-left group bg-white shadow-xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shadow-xs group-hover:bg-emerald-700 group-hover:text-white transition-colors shrink-0">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-slate-900 text-sm">Cadena de Favores (Sin Dinero)</h4>
                  <p className="text-xs text-slate-500 leading-tight mt-0.5">
                    Prestar herramientas, donar materiales o trueque de habilidades.
                  </p>
                </div>
              </button>

              {/* Botón 3: Alerta de Emergencia */}
              <button
                onClick={() => handleSelectType(PUBLICATION_TYPES.EMERGENCY)}
                className="w-full p-4 rounded-2xl border-2 border-rose-200/90 hover:border-rose-500 hover:bg-rose-50/60 active:scale-[0.98] transition-all flex items-center space-x-3.5 text-left group bg-white shadow-xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-extrabold text-rose-900 text-sm">Alerta SOS / Apoyo en Crisis</h4>
                  <p className="text-xs text-rose-700/80 leading-tight mt-0.5">
                    Adulto mayor sin agua, primeros auxilios o rescate vecinal.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* PASO 2 (CLIC 2): SELECCIÓN DE CATEGORÍA / PLANTILLA */}
          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-600">
                  Toca la opción deseada (Clic 2 de 3):
                </span>
                <button
                  onClick={() => { setStep(1); setClickCount(0); }}
                  className="text-xs text-emerald-700 font-extrabold hover:underline flex items-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
                  Volver
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {getCategoriesForType().map((cat) => {
                  const IconComp = ICON_MAP[cat.icon] || Sparkles;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 active:scale-95 transition-all text-left flex flex-col justify-between h-28 group bg-white shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-slate-900 leading-snug">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3 (CLIC 3): CONFIRMACIÓN DE UBICACIÓN Y PUBLICAR */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-inner">
                <MapPin className="w-8 h-8 animate-bounce text-emerald-700" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
                  Plantilla seleccionada
                </span>
                <h4 className="font-black text-base text-slate-900">
                  {selectedCategory?.label}
                </h4>
                
                <div className="mt-2.5 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{currentUser?.address || 'Pachacamac'} ({currentUser?.block || 'Manzana C'})</span>
                </div>
              </div>

              {/* Campo para especificar el oficio o detalle */}
              <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-800 block">
                  {selectedCategory?.id === 'otros' 
                    ? '¿Qué oficio o servicio ofreces exactamente?' 
                    : 'Detalle o especialidad rápida (Opcional):'}
                </label>
                <input
                  type="text"
                  placeholder={
                    selectedCategory?.id === 'otros'
                      ? 'Ej: Jardinería, Pintor de casas, Barbería, Soporte técnico...'
                      : 'Ej: Especialista en fugas de agua / Disponible hoy mismo...'
                  }
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  autoFocus={selectedCategory?.id === 'otros'}
                />
                {selectedCategory?.id === 'otros' && (
                  <p className="text-[10px] text-slate-500">
                    💡 Tu publicación saldrá en el directorio con este nombre y los vecinos podrán buscarla directamente.
                  </p>
                )}
              </div>

              {/* Botón Maestro del Clic 3 (Estilo Image 2) */}
              <button
                onClick={handleFinalPublish}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡Clic 3: Confirmar y Publicar en el Barrio!</span>
              </button>

              {!isOnline && (
                <p className="text-[11px] text-amber-700 font-semibold">
                  ⚡ Modo Offline: Se guardará de inmediato en tu celular.
                </p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
