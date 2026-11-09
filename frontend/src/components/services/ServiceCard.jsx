import React, { useState } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { geolocationService } from '../../services/geolocationService';
import { storageService } from '../../services/storageService';
import { getInitials } from '../../utils/userUtils';
import { 
  CheckCircle, MessageCircle, Heart, MapPin, 
  ChevronDown, ChevronUp, Send, UserCheck, Phone,
  Edit3, Trash2, Check, X
} from 'lucide-react';

export default function ServiceCard({ service }) {
  const { 
    addEndorsement, 
    editEndorsement, 
    deleteEndorsement, 
    requireAuth, 
    setAvatarPreview,
    currentUser 
  } = useNeighborhood();

  const [showEndorsements, setShowEndorsements] = useState(false);
  const [endorseInputOpen, setEndorseInputOpen] = useState(false);
  const [endorseComment, setEndorseComment] = useState('');
  const [editingEndorsementId, setEditingEndorsementId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const proximityText = geolocationService.formatProximity(service.distanceMeters);

  // Verificar si el usuario actual es el autor de este visto bueno específico
  const checkIsMyEndorsement = (end) => {
    if (!currentUser) return false;
    if (end.authorId && currentUser.id && end.authorId === currentUser.id) return true;
    if (end.authorPhone && currentUser.phone && end.authorPhone === currentUser.phone) return true;
    if (currentUser.name && end.neighbor && end.neighbor.startsWith(currentUser.name)) return true;
    return false;
  };

  const handleSendEndorsement = (e) => {
    e.preventDefault();
    if (!endorseComment.trim()) return;
    addEndorsement(service.id, endorseComment);
    setEndorseComment('');
    setEndorseInputOpen(false);
    setShowEndorsements(true);
  };

  const handleWhatsApp = () => {
    let rawPhone = service.author?.phone || '';
    if (!rawPhone || rawPhone.replace(/\D/g, '').length < 8) {
      const foundUser = storageService.findRegisteredUser(service.author?.name);
      if (foundUser?.phone) {
        rawPhone = foundUser.phone;
      }
    }

    let cleanDigits = rawPhone.replace(/\D/g, '');
    if (cleanDigits.length === 9) {
      cleanDigits = `51${cleanDigits}`;
    }

    const message = encodeURIComponent(
      `Hola ${service.author?.name || 'Vecino'}, vi tu servicio de "${service.title}" en la app vecinal Red Vecinal. Vivo cerca en tu barrio (${service.author?.block || 'Red Vecinal'}) y necesito consultar tu disponibilidad.`
    );

    const targetUrl = cleanDigits 
      ? `https://wa.me/${cleanDigits}?text=${message}` 
      : `https://wa.me/?text=${message}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all">
      
      {/* Header: Author & Proximity */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setAvatarPreview({
              name: service.author.name,
              avatar: service.author.avatar,
              block: service.author.block,
              phone: service.author.phone,
              role: service.title,
              isVerified: service.author.isVerified
            })}
            className="relative cursor-pointer group shrink-0 focus:outline-none"
            title="Toca para agrandar la foto"
          >
            {service.author.avatar ? (
              <img
                src={service.author.avatar}
                alt={service.author.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm group-hover:scale-105 active:scale-95 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-black text-sm flex items-center justify-center border-2 border-emerald-500 shadow-sm group-hover:scale-105 active:scale-95 transition-transform select-none tracking-wider">
                {getInitials(service.author.name)}
              </div>
            )}
          </button>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
              {service.author.name}
            </h4>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3 text-emerald-700 mr-0.5" />
                {service.author.block}
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
          {service.title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {service.description}
        </p>
      </div>

      {/* Price tag */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2.5 mb-3.5 text-xs">
        <span className="text-slate-900 font-extrabold">
          {(!service.priceNote || service.priceNote.includes('a convenir') || service.priceNote.includes('Tarifa barrial')) 
            ? 'Precio a coordinar por WhatsApp' 
            : service.priceNote}
        </span>
      </div>

      {/* Visto Bueno Vecinal Section */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between">
          {/* Badge de recomendación comunitaria */}
          <button
            onClick={() => setShowEndorsements(!showEndorsements)}
            className="flex items-center space-x-1.5 text-xs font-black text-emerald-950 bg-emerald-100/90 hover:bg-emerald-200 px-3 py-1.5 rounded-full border border-emerald-300 transition-colors active:scale-95"
            title="Ver los testimonios de los vecinos"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{service.endorsementsCount} Vistos Buenos</span>
            {showEndorsements ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Botón para dar visto bueno */}
          <button
            onClick={() => requireAuth(() => setEndorseInputOpen(true), 'ENDORSE')}
            className="text-xs font-black text-slate-700 hover:text-emerald-900 flex items-center space-x-1.5 bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-slate-300 transition-all active:scale-95"
            title="Dar tu visto bueno a este vecino"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>+ Dar Visto Bueno</span>
          </button>
        </div>

        {/* Input para agregar Visto Bueno */}
        {endorseInputOpen && (
          <form onSubmit={handleSendEndorsement} className="mt-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs animate-fade-in">
            <label className="block text-[11px] font-bold text-emerald-950 mb-1.5">
              Tu Visto Bueno genera confianza comunitaria en la cuadra:
            </label>
            <div className="flex space-x-1.5">
              <input
                type="text"
                placeholder="Ej: Muy puntual, honesto y cobró lo justo..."
                value={endorseComment}
                onChange={(e) => setEndorseComment(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-extrabold hover:bg-emerald-800 active:scale-95 flex items-center transition-all shadow-sm"
              >
                <Send className="w-3 h-3 mr-1" />
                Dar Visto Bueno
              </button>
            </div>
          </form>
        )}

        {/* Lista desplegable de Vistos Buenos (Speech bubbles) */}
        {showEndorsements && (
          <div className="space-y-2 mt-3 pt-2 border-t border-slate-100 text-xs animate-fade-in">
            {service.endorsements && service.endorsements.length > 0 ? (
              service.endorsements.map((end, idx) => {
                const endorsementId = end.id || `end_${idx}`;
                const isMine = checkIsMyEndorsement(end);
                const isEditing = editingEndorsementId === endorsementId;
                const isDeleting = deleteConfirmId === endorsementId;

                return (
                  <div key={endorsementId} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70 transition-all">
                    {/* Cabecera del Visto Bueno */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="flex items-center text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                          {end.neighbor}
                        </span>
                        {isMine && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-emerald-300">
                            Tú
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-400 font-normal">{end.date}</span>

                        {/* Botones de acción: SOLO visibles para el autor del comentario */}
                        {isMine && !isEditing && (
                          <div className="flex items-center space-x-1 ml-1 bg-white/80 px-1 py-0.5 rounded-lg border border-slate-200/60 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEndorsementId(endorsementId);
                                setEditCommentText(end.text);
                                setDeleteConfirmId(null);
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors active:scale-95"
                              title="Editar mi visto bueno"
                              aria-label="Editar mi visto bueno"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(endorsementId)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors active:scale-95"
                              title="Eliminar mi visto bueno"
                              aria-label="Eliminar mi visto bueno"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenido / Modo Edición en línea */}
                    {isEditing ? (
                      <div className="mt-2 space-y-2 animate-fade-in">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full p-2.5 bg-white border border-emerald-400 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none font-medium shadow-xs"
                          rows={2}
                          placeholder="Modifica tu recomendación..."
                          autoFocus
                        />
                        <div className="flex justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingEndorsementId(null)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors active:scale-95"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              editEndorsement(service.id, endorsementId, editCommentText);
                              setEditingEndorsementId(null);
                            }}
                            className="px-3 py-1 text-[11px] font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center space-x-1 transition-all shadow-xs active:scale-95"
                          >
                            <Check className="w-3 h-3" />
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic pl-3 border-l-2 border-emerald-400 leading-relaxed">
                        "{end.text}"
                        {end.isEdited && <span className="text-[9px] text-slate-400 not-italic ml-1 font-semibold">(editado)</span>}
                      </p>
                    )}

                    {/* Diálogo de confirmación para eliminar */}
                    {isDeleting && (
                      <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-[11px] animate-fade-in">
                        <span className="text-rose-800 font-extrabold">¿Borrar tu Visto Bueno?</span>
                        <div className="flex space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              deleteEndorsement(service.id, endorsementId);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-[10px] active:scale-95 transition-all shadow-xs"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-white border border-slate-300 text-slate-600 rounded-lg font-bold text-[10px] active:scale-95"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-slate-400">Sé el primer vecino en otorgar su Visto Bueno.</p>
            )}
          </div>
        )}
      </div>

      {/* Action CTA: WhatsApp Contact Button (Humanized & Clear) */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center space-x-2">
        <button
          onClick={handleWhatsApp}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Contactar por WhatsApp</span>
        </button>

        <a
          href={`tel:${service.author.phone}`}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center transition-all border border-slate-200"
          title="Llamar directamente"
        >
          <Phone className="w-4 h-4 text-emerald-700" />
        </a>
      </div>

    </div>
  );
}
