import React, { useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { geolocationService } from '../../services/geolocationService';
import { storageService } from '../../services/storageService';
import { 
  AlertTriangle, Users, MapPin, CheckCircle2, 
  MessageCircle, HeartHandshake, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function EmergencyCard({ emergency }) {
  const { volunteerForEmergency, cancelVolunteerForEmergency, requireAuth, setAvatarPreview } = useNeighborhood();
  const [hasVolunteered, setHasVolunteered] = useState(false);
  const proximityText = geolocationService.formatProximity(emergency.distanceMeters);

  const handleToggleVolunteer = () => {
    if (!hasVolunteered) {
      volunteerForEmergency(emergency.id);
      setHasVolunteered(true);
    } else {
      cancelVolunteerForEmergency(emergency.id);
      setHasVolunteered(false);
    }
  };

  const handleWhatsAppHelp = () => {
    let rawPhone = emergency.author?.phone || '';
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 8) {
      const foundUser = storageService.findRegisteredUser(emergency.author?.name);
      if (foundUser?.phone) {
        rawPhone = foundUser.phone;
      }
    }

    let cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length === 9) {
      cleanDigits = `51${cleanDigits}`;
    }

    const message = encodeURIComponent(
      `URGENTE SOS: Vecino, estoy coordinando apoyo para la emergencia "${emergency.title}" en la app Entre Vecinos. Estoy a ${proximityText}.`
    );

    const targetUrl = cleanDigits 
      ? `https://wa.me/${cleanDigits}?text=${message}` 
      : `https://wa.me/?text=${message}`;

    window.open(targetUrl, '_blank');
  };

  const isCritical = emergency.priority === 'CRITICAL';

  return (
    <div className={`rounded-3xl p-4 sm:p-5 shadow-sm transition-all border-2 ${
      isCritical 
        ? 'bg-rose-50/95 border-rose-500 shadow-rose-200' 
        : 'bg-white border-rose-400'
    }`}>
      
      {/* Top Bar: Alert Level & Proximity */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 ${
            isCritical 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-white text-rose-700 border border-rose-300'
          }`}>
            <AlertTriangle className={`w-3 h-3 ${isCritical ? 'text-white' : 'text-rose-600'}`} />
            <span>{isCritical ? 'Prioridad Crítica' : 'Prioridad Alta'}</span>
          </span>
        </div>

        <span className="text-xs font-black text-slate-800 flex items-center bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-rose-600 mr-1" />
          {proximityText}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-black text-slate-900 text-sm mb-1.5 leading-snug">
        {emergency.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-slate-700 leading-relaxed mb-3">
        {emergency.description}
      </p>

      {/* Location / Block */}
      <div className="bg-white/90 rounded-2xl p-3 border border-slate-200/80 mb-3 text-xs space-y-1.5 shadow-2xs">
        <div className="flex items-center text-slate-800 font-semibold">
          <span className="text-slate-400 mr-1.5 font-normal">Ubicación:</span>
          <span>{emergency.author.block}</span>
        </div>
        <div className="flex items-center text-rose-950 font-bold">
          <span className="text-slate-400 mr-1.5 font-normal">Se necesita:</span>
          <span>{emergency.needsSupport}</span>
        </div>
      </div>

      {/* Volunteers Bar */}
      <div className="flex items-center justify-between text-xs mb-3 px-1">
        <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
          <Users className="w-4 h-4 text-emerald-700" />
          <span>
            <strong className="text-emerald-700 font-black">{emergency.confirmedVolunteers}</strong> vecinos acudiendo
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAvatarPreview({
            name: emergency.author.name,
            avatar: emergency.author.avatar,
            block: emergency.author.block,
            phone: emergency.author.phone,
            role: emergency.title,
            isVerified: true
          })}
          className="text-[11px] text-slate-500 hover:text-emerald-700 underline-offset-2 hover:underline transition-colors focus:outline-none"
          title="Toca para ver el perfil"
        >
          Por {emergency.author.name}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/80">
        <button
          onClick={() => requireAuth(() => handleToggleVolunteer(), 'VOLUNTEER')}
          className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 ${
            hasVolunteered
              ? 'bg-slate-700 hover:bg-slate-800 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white'
          }`}
          title={hasVolunteered ? "Toca para cancelar si ya no puedes acudir" : "Sumarme como voluntario"}
        >
          {hasVolunteered ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Registrado · Toca para cancelar</span>
            </>
          ) : (
            <>
              <HeartHandshake className="w-4 h-4" />
              <span>¡Me sumo como voluntario!</span>
            </>
          )}
        </button>

        <button
          onClick={handleWhatsAppHelp}
          className="p-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white transition-colors shadow-sm"
          title="Coordinar auxilio por WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
