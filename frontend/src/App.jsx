import React from 'react';
import { useNeighborhood } from './context/NeighborhoodContext';
import { APP_MODES } from './types';
import Header from './components/common/Header';
import BottomNav from './components/common/BottomNav';
import OfflineNotice from './components/common/OfflineNotice';
import TutorialModal from './components/common/TutorialModal';
import QuickPublishModal from './components/publish/QuickPublishModal';
import QuickLoginModal from './components/auth/QuickLoginModal';
import AvatarPreviewModal from './components/common/AvatarPreviewModal';
import HomeView from './components/home/HomeView';
import ServicesView from './components/services/ServicesView';
import SolidarityView from './components/solidarity/SolidarityView';
import EmergencyView from './components/emergency/EmergencyView';
import MapView from './components/map/MapView';
import DesktopSidebar from './components/desktop/DesktopSidebar';
import DesktopRightPanel from './components/desktop/DesktopRightPanel';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-black">
              🤝
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Red Vecinal</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detectamos una nueva versión en tu navegador. Haz clic para actualizar y entrar sin problemas.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-extrabold text-xs shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
            >
              Actualizar y Entrar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { 
    activeTab, 
    appMode, 
    toastMessage, 
    loginModalOpen, 
    setLoginModalOpen, 
    backendOnline,
    currentUser 
  } = useNeighborhood();
  const isEmergency = appMode === APP_MODES.EMERGENCY;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'services':
        return <ServicesView />;
      case 'favors':
        return <SolidarityView />;
      case 'emergency':
        return <EmergencyView />;
      case 'map':
        return <MapView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isEmergency 
        ? 'bg-[#F4F7FB] text-slate-900' 
        : 'bg-[#F4F7FB] lg:bg-gradient-to-br lg:from-slate-200 lg:via-[#F4F7FB] lg:to-blue-100/30 text-slate-800'
    }`}>

      {/* Floating Toast Notification (shared across mobile & desktop) */}
      {toastMessage && (
        <div className="fixed top-4 lg:top-6 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs font-bold border pointer-events-auto ${
            toastMessage.type === 'warning'
              ? 'bg-rose-600 text-white border-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-slate-800 text-white border-slate-700'
              : 'bg-emerald-700 text-white border-emerald-800'
          }`}>
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 shrink-0 text-sky-300" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />}
            <span className="flex-1 leading-snug">{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* =========================================
          1. EXPERIENCIA MÓVIL (< lg screens)
          Pantalla completa nativa, fluida y táctil
         ========================================= */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <Header />
        <OfflineNotice />
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-[#F4F7FB]">
          {renderActiveView()}
        </main>
        <BottomNav />
      </div>

      {/* =========================================
          2. EXPERIENCIA ESCRITORIO / LAPTOP (>= lg screens)
          Diseño en 3 columnas: sin espacios vacíos, tipo app moderna
         ========================================= */}
      <div className="hidden lg:flex max-w-7xl mx-auto px-6 h-screen gap-6 items-start justify-center overflow-hidden">
        {/* Columna Izquierda: Identidad, Menú de Navegación y Botón + 3 Clics */}
        <DesktopSidebar />

        {/* Columna Central: Feed interactivo scrollable */}
        <main className={`flex-1 max-w-2xl h-[calc(100vh-3rem)] my-6 rounded-[2rem] border overflow-y-auto relative transition-colors shadow-xs ${
          isEmergency 
            ? 'bg-white border-rose-200' 
            : 'bg-white/95 backdrop-blur-sm border-slate-200/80'
        }`}>
          {/* Top Bar para Navegador de Escritorio con Insignia de Nube */}
          <div className="sticky top-0 z-20 px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-xs font-black text-slate-800 tracking-tight">Red Vecinal</span>
            </div>
            <div className="flex items-center space-x-2">
              {backendOnline ? (
                <div 
                  title="Backend en la Nube conectado (Spring Boot 3 + Supabase)"
                  className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-300 rounded-full text-[10px] font-black flex items-center space-x-1.5 shadow-2xs"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>🟢 Nube Activa</span>
                </div>
              ) : (
                <div 
                  title="Sincronizando con Backend en la Nube..."
                  className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-300 rounded-full text-[9px] font-bold flex items-center space-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>🟡 Conectando...</span>
                </div>
              )}
            </div>
          </div>
          <OfflineNotice />
          <div className="py-2">
            {renderActiveView()}
          </div>
        </main>

        {/* Columna Derecha: Radar de proximidad, Directorio de Auxilio y Pulso del Barrio */}
        <DesktopRightPanel />
      </div>

      {/* Modales globales compartidos */}
      <QuickPublishModal />
      <TutorialModal />
      <AvatarPreviewModal />
      <QuickLoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}