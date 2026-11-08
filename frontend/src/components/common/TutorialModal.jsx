import React, { useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { Wrench, HeartHandshake, ShieldAlert, X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

const TUTORIAL_SLIDES = [
  {
    icon: Wrench,
    badge: '1. Servicios de Proximidad',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    iconBg: 'bg-emerald-500 text-white',
    title: 'Oficios de tu barrio con Visto Bueno Vecinal',
    description: 'Encuentra gasfiteros, electricistas y cerrajeros que viven a pasos de tu casa. Sin pagar transporte de larga distancia y avalados por recomendaciones de tus propios vecinos.',
    tip: '💡 Consejo: Revisa cuántos vecinos de tu cuadra han dado su "Visto Bueno".'
  },
  {
    icon: HeartHandshake,
    badge: '2. Cadena de Favores',
    badgeColor: 'bg-emerald-100 text-emerald-900',
    iconBg: 'bg-emerald-700 text-white',
    title: 'Resuelve necesidades sin gastar dinero',
    description: '¿Necesitas un taladro por 15 minutos o una escalera? Pídelo en el muro solidario. También puedes donar cajas, ropa o intercambiar habilidades (ej. clases de mate por jardinería).',
    tip: '🤝 Cero dinero: pura colaboración y confianza entre vecinos.'
  },
  {
    icon: ShieldAlert,
    badge: '3. Red de Emergencia & Offline',
    badgeColor: 'bg-rose-100 text-rose-800',
    iconBg: 'bg-rose-600 text-white',
    title: 'Soporte vecinal cuando ocurre una crisis',
    description: 'En sismos, cortes de agua o apagones, la app evoluciona a un Tablero de Emergencia. Identifica adultos mayores que necesitan auxilio y comparte recursos vitales, incluso sin conexión a internet.',
    tip: '⚡ Resiliencia total: la app sigue funcionando aunque no haya señal.'
  }
];

export default function TutorialModal() {
  const { tutorialOpen, completeTutorial } = useNeighborhood();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!tutorialOpen) return null;

  const slide = TUTORIAL_SLIDES[currentSlide];
  const IconComponent = slide.icon;
  const isLast = currentSlide === TUTORIAL_SLIDES.length - 1;

  const nextSlide = () => {
    if (isLast) {
      completeTutorial();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        
        {/* Header bar */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${slide.badgeColor}`}>
            {slide.badge}
          </span>
          <button 
            onClick={completeTutorial}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Cerrar tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center flex flex-col items-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-5 transition-transform duration-300 ${slide.iconBg}`}>
            <IconComponent className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 mb-2 leading-snug">
            {slide.title}
          </h3>

          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {slide.description}
          </p>

          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 text-left">
            {slide.tip}
          </div>
        </div>

        {/* Dots indicator & Navigation Footer */}
        <div className="px-6 pb-6 pt-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex space-x-1.5">
            {TUTORIAL_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {currentSlide > 0 && (
              <button
                onClick={prevSlide}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors flex items-center"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                Atrás
              </button>
            )}

            <button
              onClick={nextSlide}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md flex items-center space-x-1"
            >
              <span>{isLast ? '¡Comenzar ahora!' : 'Siguiente'}</span>
              {isLast ? <Check className="w-4 h-4 ml-1" /> : <ChevronRight className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
