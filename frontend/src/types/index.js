/**
 * @fileoverview Constantes y definiciones de tipos para el dominio de VecinOS
 */

export const APP_MODES = {
  NORMAL: 'NORMAL',         // Modo cotidiano: oficios y favores comunitarios
  EMERGENCY: 'EMERGENCY',   // Modo contingencia: auxilio, vulnerabilidad y recursos críticos
};

export const PUBLICATION_TYPES = {
  SERVICE: 'SERVICE',       // Módulo 1: Oficio / Servicio con dinero
  FAVOR: 'FAVOR',           // Módulo 2: Cadena de favores sin dinero
  EMERGENCY: 'EMERGENCY',   // Módulo Emergencia: Reporte crítico o recurso
};

export const SERVICE_CATEGORIES = [
  { id: 'gasfiteria', label: 'Gasfitería & Plomería', icon: 'Wrench' },
  { id: 'electricidad', label: 'Electricidad', icon: 'Zap' },
  { id: 'cerrajeria', label: 'Cerrajería', icon: 'Key' },
  { id: 'carpinteria', label: 'Carpintería', icon: 'Hammer' },
  { id: 'mascotas', label: 'Paseo de Mascotas', icon: 'Dog' },
  { id: 'clases', label: 'Clases & Apoyo Escolar', icon: 'BookOpen' },
  { id: 'costura', label: 'Costura & Confección', icon: 'Scissors' },
  { id: 'otros', label: 'Otros Oficios', icon: 'Briefcase' },
];

export const FAVOR_CATEGORIES = [
  { id: 'prestamo', label: 'Préstamo de Herramienta', icon: 'PenTool', type: 'PRESTAMO' },
  { id: 'ayuda', label: 'Ayuda Puntual / Mano de Obra', icon: 'HandHelping', type: 'AYUDA' },
  { id: 'donacion', label: 'Donación de Materiales/Ropa', icon: 'Gift', type: 'DONACION' },
  { id: 'trueque', label: 'Intercambio de Habilidades', icon: 'Repeat', type: 'TRUEQUE' },
  { id: 'movilidad', label: 'Movilidad Solidaria', icon: 'Car', type: 'MOVILIDAD' },
];

export const EMERGENCY_CATEGORIES = [
  { id: 'vulnerable', label: 'Adulto Mayor / Persona Vulnerable', icon: 'HeartHandshake', priority: 'HIGH' },
  { id: 'primeros_auxilios', label: 'Primeros Auxilios / Medicina', icon: 'Activity', priority: 'CRITICAL' },
  { id: 'agua_alimento', label: 'Agua Potable / Raciones', icon: 'Droplets', priority: 'HIGH' },
  { id: 'generador_luz', label: 'Energía / Generador Eléctrico', icon: 'ZapOff', priority: 'MEDIUM' },
  { id: 'rescate', label: 'Rescate / Despeje de Vía', icon: 'ShieldAlert', priority: 'CRITICAL' },
];
