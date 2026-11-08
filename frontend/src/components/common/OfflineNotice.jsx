import React from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { WifiOff, CheckCircle } from 'lucide-react';

export default function OfflineNotice() {
  const { isOnline } = useNeighborhood();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs flex items-center justify-between font-medium shadow-sm animate-fade-in">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>
          <strong>Estás sin conexión a internet:</strong> Mostrando datos guardados en tu teléfono. Las publicaciones que hagas se guardarán localmente.
        </span>
      </div>
      <div className="shrink-0 ml-2 flex items-center space-x-1 text-[11px] bg-amber-600/30 px-2 py-0.5 rounded-full font-bold">
        <CheckCircle className="w-3 h-3 text-amber-950" />
        <span>Offline OK</span>
      </div>
    </div>
  );
}
