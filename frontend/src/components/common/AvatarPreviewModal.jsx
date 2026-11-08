import React, { useEffect } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { getInitials } from '../../utils/userUtils';

export default function AvatarPreviewModal() {
  const { avatarPreview, setAvatarPreview } = useNeighborhood();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAvatarPreview(null);
      }
    };
    if (avatarPreview) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [avatarPreview, setAvatarPreview]);

  if (!avatarPreview) return null;

  // Cargar imagen en alta resolución si es de Unsplash
  const highResUrl = avatarPreview.avatar
    ? avatarPreview.avatar.replace('w=150', 'w=800')
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in cursor-pointer select-none"
      onClick={() => setAvatarPreview(null)}
    >
      <div
        className="relative max-w-xs sm:max-w-md w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900 animate-scale-up"
        onClick={() => setAvatarPreview(null)}
      >
        {/* Foto de perfil agrandada únicamente */}
        {highResUrl ? (
          <img
            src={highResUrl}
            alt={avatarPreview.name || 'Foto de perfil'}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-700 to-emerald-900 text-white select-none">
            <span className="text-6xl sm:text-7xl font-black tracking-wider">
              {getInitials(avatarPreview.name)}
            </span>
            <span className="text-xs text-emerald-100 mt-2 font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
              {avatarPreview.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
