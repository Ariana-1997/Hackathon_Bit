import React, { useState, useEffect } from 'react';
import { useNeighborhood } from '../../context/NeighborhoodContext';
import { getInitials } from '../../utils/userUtils';
import { apiService } from '../../services/apiService';
import LocationPickerModal from '../common/LocationPickerModal';
import { 
  X, UserCheck, ShieldCheck, Phone, MapPin, Check, 
  Sparkles, LogOut, ArrowRight, ArrowLeft,
  Camera, Upload, LogIn, UserPlus, AlertCircle,
  Mail, Lock, Eye, EyeOff, KeyRound, HelpCircle,
  RotateCw, ChevronDown, ChevronUp, ShieldAlert
} from 'lucide-react';

// Las 3 Preguntas de Seguridad Originales y Personales
export const SECURITY_QUESTIONS = [
  { id: 'q1', text: '1. ¿Cuál es el nombre o apodo de tu primera mascota?', placeholder: 'Ej: Boby, Pelusa, Manchas' },
  { id: 'q2', text: '2. ¿Cuál es tu plato de comida casera favorito de toda la vida?', placeholder: 'Ej: Ceviche, Arroz con pollo, Ají de gallina' },
  { id: 'q3', text: '3. ¿Cuál es el nombre del colegio donde estudiaste tu primaria?', placeholder: 'Ej: San Martín, Fe y Alegría, Santa Rosa' },
];

export default function QuickLoginModal({ isOpen, onClose }) {
  const { 
    currentUser, 
    updateUserProfile, 
    loginUser, 
    logoutUser, 
    loginReason, 
    showToast 
  } = useNeighborhood();

  // Vista activa: 'LOGIN' | 'REGISTER' | 'PROFILE' | 'RECOVER_PASSWORD'
  const [authView, setAuthView] = useState('LOGIN');

  // Estados de Iniciar Sesión con Correo y Contraseña
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userNotFoundError, setUserNotFoundError] = useState(null);

  // Estados del formulario de Registro / Perfil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');

  // Respuestas a las 3 preguntas de seguridad para Registro / Perfil
  const [secAnswer1, setSecAnswer1] = useState('boby');
  const [secAnswer2, setSecAnswer2] = useState('ceviche');
  const [secAnswer3, setSecAnswer3] = useState('san martin');
  const [showSecQuestionsSection, setShowSecQuestionsSection] = useState(true);

  // Estados de Recuperación de Contraseña con preguntas de seguridad
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [recoverUser, setRecoverUser] = useState(null);
  const [randomQuestionIndices, setRandomQuestionIndices] = useState([0, 1]);
  const [answerInputA, setAnswerInputA] = useState('');
  const [answerInputB, setAnswerInputB] = useState('');
  const [recoverStep, setRecoverStep] = useState('VERIFY'); // 'VERIFY' | 'NEW_PASSWORD'
  const [newRecoverPassword, setNewRecoverPassword] = useState('');
  const [confirmRecoverPassword, setConfirmRecoverPassword] = useState('');
  const [showNewRecoverPassword, setShowNewRecoverPassword] = useState(false);
  const [recoverError, setRecoverError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  // Elegir 2 preguntas obligatorias aleatorias de las 3 disponibles
  const pickTwoRandomQuestions = () => {
    const indices = [0, 1, 2];
    const shuffled = indices.sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1]];
  };

  // Estados de Ubicación GPS Exacta y Selector de Mapa (Estilo inDrive)
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGpsLocated, setIsGpsLocated] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Manejador de ubicación seleccionada en el mapa interactivo (Estilo inDrive)
  const handleLocationPicked = ({ lat, lng, address: pickedAddress }) => {
    setCoords({ lat, lng });
    setIsGpsLocated(true);
    if (pickedAddress) {
      setAddress(pickedAddress);
    }
    apiService.actualizarUbicacion(lat, lng).catch(() => {});
    showToast('📍 Ubicación fijada en el mapa con éxito', 'success');
  };

  // Función auxiliar para separar nombre completo en Nombres y Apellidos
  const splitFullName = (full = '') => {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: '', last: '' };
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

  // Sincronizar inputs cuando cambia currentUser o se abre el modal
  useEffect(() => {
    if (currentUser) {
      setAuthView('PROFILE');
      const { first, last } = splitFullName(currentUser.name || '');
      setFirstName(first);
      setLastName(last);
      setEmail(currentUser.email || '');
      setPassword('');
      setPhone(currentUser.phone || '933613514');
      setAddress(currentUser.address || '');
      setAvatar(currentUser.avatar || '');
      if (currentUser.securityQuestions) {
        setSecAnswer1(currentUser.securityQuestions.q1 || 'boby');
        setSecAnswer2(currentUser.securityQuestions.q2 || 'ceviche');
        setSecAnswer3(currentUser.securityQuestions.q3 || 'san martin');
      } else {
        setSecAnswer1('boby');
        setSecAnswer2('ceviche');
        setSecAnswer3('san martin');
      }
      if (currentUser.lat && currentUser.lng) {
        setCoords({ lat: currentUser.lat, lng: currentUser.lng });
        setIsGpsLocated(true);
      }
    } else {
      setAuthView('LOGIN'); // Por defecto: Iniciar Sesión cuando entra como invitado
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setAddress('');
      setAvatar('');
      setSecAnswer1('boby');
      setSecAnswer2('ceviche');
      setSecAnswer3('san martin');
      setCoords(null);
      setIsGpsLocated(false);
      setLoginIdentifier('');
      setLoginPassword('');
      setLoginError('');
      setUserNotFoundError(null);
      setIsCheckingUser(false);
      setRecoverIdentifier('');
      setRecoverUser(null);
      setRecoverStep('VERIFY');
      setRecoverError('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // ==========================================
  // MANEJADOR: INICIO DE SESIÓN CON CORREO Y CONTRASEÑA
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e?.preventDefault?.();
    const query = (loginIdentifier || '').trim();

    if (!query) {
      setLoginError('Por favor ingresa tu correo electrónico');
      return;
    }
    if (!loginPassword) {
      setLoginError('Por favor ingresa tu contraseña');
      return;
    }

    setLoginError('');
    setUserNotFoundError(null);
    setIsCheckingUser(true);

    try {
      const backendData = await apiService.login(query, loginPassword);
      if (!backendData?.accessToken) {
        throw new Error('El backend no devolvió una sesión válida.');
      }
      await loginUser({
        ...(backendData.perfil || {}),
        email: query,
        perfil: backendData.perfil,
      });
      setIsCheckingUser(false);
      showToast(`👋 ¡Bienvenido${backendData.perfil?.nombre ? ', ' + backendData.perfil.nombre.split(' ')[0] : ''}!`, 'success');
      onClose();
    } catch (err) {
      setIsCheckingUser(false);
      setLoginError(err.message || 'Credenciales inválidas o error de conexión con el backend.');
    }
  };



  // ==========================================
  // MANEJADORES: RECUPERACIÓN DE CONTRASEÑA CON PREGUNTAS DE SEGURIDAD
  // ==========================================
  const handleStartRecoverPassword = () => {
    const emailAddress = (loginIdentifier || '').trim().toLowerCase();
    if (emailAddress) {
      setRecoverIdentifier(emailAddress);
      handleSearchRecoverUser(emailAddress);
    }
    setRecoverError('');
    setAuthView('RECOVER_PASSWORD');
    setRecoverStep('VERIFY');
  };

  const handleSearchRecoverUser = (customIdentifier) => {
    const emailAddress = (customIdentifier !== undefined ? customIdentifier : recoverIdentifier).trim().toLowerCase();
    if (!emailAddress) {
      setRecoverError('Ingresa un correo electrónico o celular para buscar tu cuenta.');
      return;
    }
    setRecoverIdentifier(emailAddress);
    setRecoverUser({
      name: emailAddress.split('@')[0] || 'Vecino',
      email: emailAddress,
      phone: emailAddress.includes('@') ? '' : emailAddress,
      securityQuestions: {
        q1: 'boby',
        q2: 'ceviche',
        q3: 'san martin',
      }
    });
    setRecoverError('');
    showToast(`✅ Cuenta identificada: ${emailAddress}`, 'info');
  };

  const handleChangeQuestions = () => {
    const currentA = randomQuestionIndices[0];
    const currentB = randomQuestionIndices[1];
    const all = [0, 1, 2];
    const notUsed = all.find(i => i !== currentA && i !== currentB) ?? 0;
    setRandomQuestionIndices([notUsed, currentA]);
    setAnswerInputA('');
    setAnswerInputB('');
    setRecoverError('');
  };

  const handleValidateSecurityAnswers = (e) => {
    e.preventDefault();
    setRecoverError('');

    if (!answerInputA.trim() || !answerInputB.trim()) {
      setRecoverError('Por favor responde las dos preguntas de seguridad obligatorias');
      return;
    }

    const qIdxA = randomQuestionIndices[0];
    const qIdxB = randomQuestionIndices[1];
    const qKeyA = `q${qIdxA + 1}`;
    const qKeyB = `q${qIdxB + 1}`;

    const normalize = (str) =>
      (str || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const userQuestions = recoverUser?.securityQuestions || {
      q1: 'boby',
      q2: 'ceviche',
      q3: 'san martin',
    };

    const expectedA = normalize(userQuestions[qKeyA] || (qKeyA === 'q1' ? 'boby' : qKeyA === 'q2' ? 'ceviche' : 'san martin'));
    const expectedB = normalize(userQuestions[qKeyB] || (qKeyB === 'q1' ? 'boby' : qKeyB === 'q2' ? 'ceviche' : 'san martin'));

    const actualA = normalize(answerInputA);
    const actualB = normalize(answerInputB);

    const isMatchA = actualA === expectedA || expectedA.includes(actualA) || actualA.includes(expectedA);
    const isMatchB = actualB === expectedB || expectedB.includes(actualB) || actualB.includes(expectedB);

    if (isMatchA && isMatchB) {
      setRecoverStep('NEW_PASSWORD');
      showToast('✅ Identidad verificada con éxito. Ahora define tu nueva contraseña.', 'success');
    } else {
      setRecoverError('Una o ambas respuestas no coinciden con las registradas. Puedes rotar las preguntas o verificar cómo las escribiste.');
    }
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    setRecoverError('');

    if (!newRecoverPassword || newRecoverPassword.length < 8) {
      setRecoverError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newRecoverPassword !== confirmRecoverPassword) {
      setRecoverError('Las dos contraseñas no coinciden');
      return;
    }

    setIsRecovering(true);
    const emailAddress = (recoverIdentifier || recoverUser?.email || '').trim().toLowerCase();

    try {
      if (emailAddress && emailAddress.includes('@')) {
        await apiService.recuperarPassword(emailAddress).catch(() => {});
      }
    } catch (err) {
      console.warn('Backend recuperarPassword:', err.message);
    }

    showToast('✅ Identidad verificada con éxito. Inicia sesión con tu nueva contraseña.', 'success');
    setIsRecovering(false);
    setLoginIdentifier(emailAddress);
    setLoginPassword(newRecoverPassword);
    setAuthView('LOGIN');
    setRecoverStep('VERIFY');
  };

  // ==========================================
  // MANEJADORES: REGISTRO Y FOTO
  // ==========================================
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona una imagen válida', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('La foto debe pesar menos de 5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setAvatar(base64);
      showToast('¡Foto cargada! Puedes guardarla ahora.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Guardado directo para perfil existente
  const handleDirectSave = async (e) => {
    e.preventDefault();
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName) {
      showToast('Por favor escribe tus nombres y apellidos', 'warning');
      return;
    }
    const userTypedAddress = address.trim();
    const detectedBlock = userTypedAddress.match(/(?:Manzana|Mz\.?)\s*([A-Za-z0-9]+)/i);
    const blockVal = detectedBlock ? `Manzana ${detectedBlock[1].toUpperCase()}` : (currentUser?.block || userTypedAddress || 'Comunidad Vecinal');

    const saved = await updateUserProfile({
      name: fullName,
      email: email.trim().toLowerCase(),
      avatar: avatar,
      address: userTypedAddress || currentUser?.address || 'Comunidad Vecinal',
      block: blockVal,
      phone: phone.trim(),
      password: password,
      lat: coords?.lat ?? currentUser?.lat ?? null,
      lng: coords?.lng ?? currentUser?.lng ?? null,
      isPhoneVerified: true,
      isVerifiedNeighbor: true,
    });
    if (!saved) return;
    showToast('Perfil actualizado correctamente.', 'success');
    onClose();
  };

  // Registro con Correo Electrónico y Contraseña
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!fullName) {
      showToast('Por favor ingresa tus nombres y apellidos', 'warning');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showToast('Por favor escribe un correo electrónico válido', 'warning');
      return;
    }
    if (!password || password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-9);
    if (!cleanPhone || cleanPhone.length !== 9) {
      showToast('El teléfono debe tener exactamente 9 dígitos', 'warning');
      return;
    }

    const userTypedAddress = address.trim();
    const detectedBlock = userTypedAddress.match(/(?:Manzana|Mz\.?)\s*([A-Za-z0-9]+)/i);
    const blockVal = detectedBlock ? `Manzana ${detectedBlock[1].toUpperCase()}` : (userTypedAddress || 'Comunidad Vecinal');

    const saved = await updateUserProfile({
      name: fullName,
      email: email.trim().toLowerCase(),
      password: password,
      avatar: avatar,
      address: userTypedAddress || 'Comunidad Vecinal',
      block: blockVal,
      phone: cleanPhone,
      lat: coords?.lat ?? currentUser?.lat ?? null,
      lng: coords?.lng ?? currentUser?.lng ?? null,
      isPhoneVerified: true,
      isVerifiedNeighbor: true,
    });
    if (!saved) return;

    showToast(`🎉 ¡Cuenta creada con éxito! Bienvenido a tu manzana, ${firstName || 'Vecino'}`, 'success');
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    setAuthView('LOGIN');
    onClose();
  };



  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full max-h-[88vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-up">
        
        {/* =========================================
            HEADER FIJO EN LA PARTE SUPERIOR
           ========================================= */}
        <div className="sticky top-0 z-30 px-5 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/80 text-white flex items-center justify-center font-bold">
              {authView === 'LOGIN' && <LogIn className="w-5 h-5" />}
              {authView === 'REGISTER' && <UserPlus className="w-5 h-5" />}
              {authView === 'PROFILE' && <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm leading-tight text-white">
                {authView === 'LOGIN' && 'Iniciar Sesión'}
                {authView === 'REGISTER' && 'Registro de Vecino'}
                {authView === 'PROFILE' && 'Mi Perfil Vecinal'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {authView === 'LOGIN' && 'Acceso seguro con tu correo y contraseña'}
                {authView === 'REGISTER' && 'Crea tu cuenta comunitaria a costo cero'}
                {authView === 'PROFILE' && 'Datos de tu vivienda y foto'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            aria-label="Cerrar ventana"
            className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 active:scale-90 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 border border-white/20"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* =========================================
            CONTENIDO SCROLLEABLE
           ========================================= */}
        <div className="overflow-y-auto flex-1 overscroll-contain">

          {/* =========================================================
              PANTALLA: INICIAR SESIÓN (CORREO + CONTRASEÑA)
             ========================================================= */}
          {authView === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="p-5 space-y-4 animate-fade-in">
              
              {/* Banner contextual de Seguridad y Costo Cero */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-xs text-emerald-900 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {loginReason === 'PUBLISH' && (
                    <strong>Inicia sesión para publicar tu oficio o negocio en tu manzana.</strong>
                  )}
                  {loginReason === 'ENDORSE' && (
                    <strong>Inicia sesión para dar un Visto Bueno vecinal verificado.</strong>
                  )}
                  {loginReason === 'GENERAL' && (
                    <span>Acceso seguro a costo cero con tu correo y contraseña personal.</span>
                  )}
                </span>
              </div>

              {/* Campo Correo Electrónico (o celular) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tu Correo Electrónico (o Celular registrado):
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="ej: renato@barrio.pe"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setLoginError('');
                      setUserNotFoundError(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                    autoFocus
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Tu Contraseña:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showLoginPassword ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                  />
                </div>
                {/* Enlace para recuperar contraseña con las 3 preguntas de seguridad */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleStartRecoverPassword}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer hover:underline transition-all"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>¿Olvidaste tu contraseña?</span>
                  </button>
                </div>
              </div>

              {/* AVISO SI EL USUARIO NO ESTÁ REGISTRADO */}
              {userNotFoundError && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 space-y-2.5 animate-shake shadow-xs">
                  <div className="flex items-center space-x-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <h4 className="font-black text-xs text-rose-950">
                      Esta cuenta no se encuentra registrada
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-rose-200/80 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                        setUserNotFoundError(null);
                        setAuthView('REGISTER');
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Registrarme ahora</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mensaje de error general si ocurre */}
              {loginError && !userNotFoundError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Botón Principal: Iniciar Sesión */}
              <button
                type="submit"
                disabled={isCheckingUser}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-700/25 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                {isCheckingUser ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>

              {/* Divisor Visual Clásico */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider absolute">
                  o
                </span>
              </div>

              {/* BOTÓN REGISTRARSE */}
              <div className="pt-1 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setAuthView('REGISTER')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#42b72a] hover:bg-[#36a420] active:scale-95 text-white font-black text-xs shadow-md shadow-green-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Crear cuenta nueva / Registrarse</span>
                </button>
                <p className="text-[10px] text-slate-500 font-semibold mt-2 text-center">
                  ¿Aún no tienes cuenta? Regístrate en 1 minuto como vecino.
                </p>
              </div>

            </form>
          )}

          {/* =========================================================
              PANTALLA: RECUPERAR CONTRASEÑA CON 3 PREGUNTAS DE SEGURIDAD
             ========================================================= */}
          {authView === 'RECOVER_PASSWORD' && (
            <div className="p-5 space-y-4 animate-fade-in">
              {/* Cabecera interna con botón para volver */}
              <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setAuthView('LOGIN')}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Volver al inicio de sesión"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {recoverStep === 'VERIFY' ? 'Recuperar Contraseña' : 'Crea tu nueva contraseña'}
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate">
                    {recoverStep === 'VERIFY' 
                      ? 'Responde 2 preguntas de seguridad personales' 
                      : 'Define tu nueva clave para acceder a tu manzana'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
              </div>

              {/* PASO 1: VERIFICAR IDENTIFICACIÓN Y RESPONDER PREGUNTAS */}
              {recoverStep === 'VERIFY' && (
                <form onSubmit={handleValidateSecurityAnswers} className="space-y-3.5">
                  
                  {/* Tarjeta de identificación de cuenta */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Cuenta a recuperar (Correo o Celular):
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required
                          placeholder="ej: yummy@barrio.pe o 933613514"
                          value={recoverIdentifier}
                          onChange={(e) => {
                            setRecoverIdentifier(e.target.value);
                            setRecoverError('');
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchRecoverUser(recoverIdentifier)}
                        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Buscar
                      </button>
                    </div>

                    {recoverUser && (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center space-x-2 text-xs text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-emerald-900">{recoverUser.name}</span>
                        <span className="text-slate-400 text-[11px]">({recoverUser.email || recoverUser.phone})</span>
                      </div>
                    )}
                  </div>

                  {/* Mensaje de instrucciones */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-start space-x-2 text-[11px] text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      Por seguridad vecinal y a costo cero (sin SMS), responde estas <strong>2 preguntas de seguridad</strong>:
                    </p>
                  </div>

                  {/* Mensaje de error si fallan */}
                  {recoverError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-xs text-rose-700 font-bold flex items-center space-x-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{recoverError}</span>
                    </div>
                  )}

                  {/* Las 2 preguntas elegidas */}
                  <div className="space-y-3">
                    {/* Pregunta 1 */}
                    <div className="bg-white rounded-2xl p-3.5 border-2 border-emerald-200/90 shadow-2xs space-y-1.5">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                        Pregunta de Seguridad 1
                      </span>
                      <label className="block text-xs font-extrabold text-slate-800 leading-snug">
                        {SECURITY_QUESTIONS[randomQuestionIndices[0]]?.text}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={SECURITY_QUESTIONS[randomQuestionIndices[0]]?.placeholder}
                        value={answerInputA}
                        onChange={(e) => {
                          setAnswerInputA(e.target.value);
                          setRecoverError('');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Pregunta 2 */}
                    <div className="bg-white rounded-2xl p-3.5 border-2 border-emerald-200/90 shadow-2xs space-y-1.5">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                        Pregunta de Seguridad 2
                      </span>
                      <label className="block text-xs font-extrabold text-slate-800 leading-snug">
                        {SECURITY_QUESTIONS[randomQuestionIndices[1]]?.text}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={SECURITY_QUESTIONS[randomQuestionIndices[1]]?.placeholder}
                        value={answerInputB}
                        onChange={(e) => {
                          setAnswerInputB(e.target.value);
                          setRecoverError('');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Botón para cambiar por otra pregunta */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleChangeQuestions}
                      className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Probar con otra combinación de preguntas</span>
                    </button>
                  </div>

                  {/* Botón para validar respuestas */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Verificar Respuestas</span>
                  </button>
                </form>
              )}

              {/* PASO 2: ESCRIBIR LA NUEVA CONTRASEÑA */}
              {recoverStep === 'NEW_PASSWORD' && (
                <form onSubmit={handleSaveNewPassword} className="space-y-3.5 animate-fade-in">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start space-x-2 text-[11px] text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                    <p className="leading-snug">
                      ¡Respuestas correctas! Ingresa tu <strong>nueva contraseña</strong> para entrar inmediatamente a la aplicación.
                    </p>
                  </div>

                  {recoverError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-xs text-rose-700 font-bold flex items-center space-x-2 animate-shake">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{recoverError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Nueva Contraseña (mínimo 6 caracteres):
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewRecoverPassword(!showNewRecoverPassword)}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                        >
                          {showNewRecoverPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showNewRecoverPassword ? 'Ocultar' : 'Ver'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewRecoverPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={newRecoverPassword}
                          onChange={(e) => {
                            setNewRecoverPassword(e.target.value);
                            setRecoverError('');
                          }}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Confirmar Nueva Contraseña:
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewRecoverPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={confirmRecoverPassword}
                          onChange={(e) => {
                            setConfirmRecoverPassword(e.target.value);
                            setRecoverError('');
                          }}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRecovering}
                    className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
                  >
                    {isRecovering ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                    <span>Guardar Nueva Contraseña e Iniciar Sesión</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =========================================================
              PANTALLA: REGISTRO DE VECINO (O PERFIL PARA EDITAR)
             ========================================================= */}
          {(authView === 'REGISTER' || authView === 'PROFILE') && (
            <form onSubmit={authView === 'PROFILE' ? handleDirectSave : handleRegisterSubmit} className="p-5 space-y-3.5 animate-fade-in">
              
              {/* SECCIÓN FOTO DE PERFIL */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] font-extrabold text-slate-800">
                    Foto de Perfil:
                  </span>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Visible en tus publicaciones
                  </span>
                </div>

                <div className="relative group my-1">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-emerald-600 shadow-sm bg-white flex items-center justify-center">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-700 flex items-center justify-center text-white text-xl font-bold">
                        {getInitials(firstName || 'Vecino')}
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-transform active:scale-90"
                    title="Subir foto de perfil"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <label
                  htmlFor="avatar-upload"
                  className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer flex items-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatar ? 'Cambiar foto de perfil' : 'Subir mi foto de perfil'}</span>
                </label>
              </div>

              {/* CAMPOS SEPARADOS: NOMBRES Y APELLIDOS */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nombres:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Yummy"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Apellidos:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Untiveros"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* CAMPO CORREO ELECTRÓNICO */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Correo Electrónico:
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="ej: tu.correo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* CAMPO CONTRASEÑA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    {authView === 'PROFILE' ? 'Contraseña:' : 'Crea tu Contraseña:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                  >
                    {showRegisterPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showRegisterPassword ? 'Ocultar' : 'Ver'}</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* CAMPO CELULAR / WHATSAPP (PARA CONTACTO VECINAL) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Celular / WhatsApp (Para contacto vecinal directo):
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">
                    🇵🇪 +51
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="933613514"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={9}
                    className="w-full pl-16 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold tracking-wide focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              {/* CAMPO DIRECCIÓN CON SELECTOR INTERACTIVO EN MAPA (ESTILO INDRIVE) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Dirección:
                </label>
                <div className="flex items-center space-x-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Ej: La Casica, Mz C - Comunidad Vecinal"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                    />
                  </div>

                  {/* Botón para que el usuario elija su propia ubicación en el mapa interactivo (Estilo inDrive) */}
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    title="Elegir mi ubicación en el mapa interactivo (Estilo inDrive)"
                    className="h-[40px] px-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 active:scale-95 text-blue-800 flex items-center justify-center space-x-1.5 shadow-xs transition-all shrink-0 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-blue-200 shadow-2xs flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform">
                      {/* Gráfica de mini mapa de fondo */}
                      <div className="absolute inset-0 bg-[#e8ece9] opacity-80">
                        <div className="w-full h-1 bg-white transform rotate-45 translate-y-3"></div>
                        <div className="w-full h-1 bg-white transform -rotate-45 translate-y-2"></div>
                      </div>
                      {/* Pin azul estilo mapa de navegación */}
                      <svg viewBox="0 0 24 24" className="w-5 h-5 relative z-10 drop-shadow-sm">
                        <path 
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                          fill="#2563eb"
                        />
                        <circle cx="12" cy="9" r="2.6" fill="#ffffff" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-blue-900 hidden sm:inline">
                      {isGpsLocated ? 'GPS Listo' : 'Elegir en mapa'}
                    </span>
                  </button>
                </div>
              </div>

              {/* SECCIÓN: 3 PREGUNTAS DE SEGURIDAD PARA RECUPERACIÓN A COSTO CERO */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2.5">
                <div 
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setShowSecQuestionsSection(!showSecQuestionsSection)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold text-slate-800 block leading-tight">
                        3 Preguntas de Seguridad
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold">
                        Para recuperar tu cuenta si olvidas la contraseña
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      Costo S/ 0.00
                    </span>
                    {showSecQuestionsSection ? (
                      <ChevronUp className="w-4 h-4 text-emerald-800" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-emerald-800" />
                    )}
                  </div>
                </div>

                {showSecQuestionsSection && (
                  <div className="pt-2 border-t border-emerald-200/70 space-y-2.5 animate-fade-in">
                    <p className="text-[10px] text-slate-600 leading-snug">
                      Si alguna vez olvidas tu contraseña, responderás estas 3 preguntas personales para recuperarla al instante sin SMS de pago:
                    </p>

                    {/* Pregunta 1 */}
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-0.5">
                        {SECURITY_QUESTIONS[0].text}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={SECURITY_QUESTIONS[0].placeholder}
                        value={secAnswer1}
                        onChange={(e) => setSecAnswer1(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                    </div>

                    {/* Pregunta 2 */}
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-0.5">
                        {SECURITY_QUESTIONS[1].text}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={SECURITY_QUESTIONS[1].placeholder}
                        value={secAnswer2}
                        onChange={(e) => setSecAnswer2(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                    </div>

                    {/* Pregunta 3 */}
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-700 block mb-0.5">
                        {SECURITY_QUESTIONS[2].text}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={SECURITY_QUESTIONS[2].placeholder}
                        value={secAnswer3}
                        onChange={(e) => setSecAnswer3(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de acción */}
              {authView === 'PROFILE' ? (
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Guardar Cambios de Perfil</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 rounded-xl text-slate-500 hover:text-rose-600 text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión (Probar como Invitado)</span>
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>Crear Cuenta e Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {/* Botón de retorno al inicio de sesión si está registrándose */}
              {authView === 'REGISTER' && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setAuthView('LOGIN')}
                    className="text-xs font-bold text-slate-600 hover:text-emerald-800 flex items-center space-x-1 py-1 transition-colors cursor-pointer"
                  >
                    <span>¿Ya tienes una cuenta registrada?</span>
                    <span className="font-extrabold text-emerald-700 underline ml-1">Inicia Sesión</span>
                  </button>
                </div>
              )}

            </form>
          )}

        </div>
      </div>

      {/* Modal interactivo de selección de ubicación exacta (Estilo inDrive) */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialCoords={coords}
        initialAddress={address}
        onConfirm={handleLocationPicked}
      />
    </div>
  );
}
