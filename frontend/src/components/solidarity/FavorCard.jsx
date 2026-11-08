import React, { useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { geolocationService } from '../../services/geolocationService';
import { storageService } from '../../services/storageService';
import { getInitials } from '../../utils/userUtils';
import { 
  HeartHandshake, MessageCircle, MapPin, 
  CheckCircle2 
} from 'lucide-react';

export default function FavorCard({ favor }) {
  const { setAvatarPreview } = useNeighborhood();
  const [requested, setRequested] = useState(false);
  const proximityText = geolocationService.formatProximity(favor.distanceMeters);

  const handleWhatsApp = () => {
    setRequested(true);
    let rawPhone = favor.author?.phone || '';
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 8) {
      const foundUser = storageService.findRegisteredUser(favor.author?.name);
      if (foundUser?.phone) {
        rawPhone = foundUser.phone;
      }
    }

    let cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length === 9) {
      cleanDigits = `51${cleanDigits}`;
    }

    const message = encodeURIComponent(
      `Hola ${favor.author?.name || 'Vecino'}, vi tu publicación solidaria de "${favor.title}" en la app Entre Vecinos. Vivo cerca en tu barrio (${favor.author?.block || 'Pachacamac'}) y me gustaría coordinar.`
    );

    const targetUrl = cleanDigits 
      ? `https://wa.me/${cleanDigits}?text=${message}` 
      : `https://wa.me/?text=${message}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
      
      {/* Header: Author & Location */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setAvatarPreview({
              name: favor.author.name,
              avatar: favor.author.avatar,
              block: favor.author.block,
              phone: favor.author.phone,
              role: favor.title,
              isVerified: favor.author.isVerified
            })}
            className="relative cursor-pointer group shrink-0 focus:outline-none"
            title="Toca para agrandar la foto"
          >
            {favor.author.avatar ? (
              <img
                src={favor.author.avatar}
                alt={favor.author.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm group-hover:scale-105 active:scale-95 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-black text-sm flex items-center justify-center border-2 border-emerald-500 shadow-sm group-hover:scale-105 active:scale-95 transition-transform select-none tracking-wider">
                {getInitials(favor.author.name)}
              </div>
            )}
          </button>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
              {favor.author.name}
            </h4>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3 text-emerald-700 mr-0.5" />
                {favor.author.block}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {proximityText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-3 pl-0.5">
        <h3 className="font-extrabold text-slate-900 text-sm mb-1 leading-snug">
          {favor.title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {favor.description}
        </p>
      </div>

      {/* Cost badge (ALWAYS ZERO MONEY / SOLIDARITY) */}
      <div className="bg-emerald-100/90 border border-emerald-300/80 rounded-2xl px-3.5 py-2 mb-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-emerald-950 font-black">
          <HeartHandshake className="w-4 h-4 text-emerald-700" />
          <span>CERO DINERO</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-900">
          Economía Solidaria del Barrio
        </span>
      </div>

      {/* Action CTA: WhatsApp */}
      <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
        <button
          onClick={handleWhatsApp}
          className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95 ${
            requested
              ? 'bg-slate-100 text-slate-700 border border-slate-300'
              : 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-emerald-600/10'
          }`}
        >
          {requested ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Coordinación iniciada por WhatsApp</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              <span>Contactar por WhatsApp</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
