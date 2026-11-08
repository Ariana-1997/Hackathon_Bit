/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta Azul Acero Cívico / Convivencia Barrial (Extraído exactamente de la imagen del usuario #527EAA)
        emerald: {
          50: '#F2F6FA',   // Fondo cielo suave muy claro, fresco y limpio
          100: '#E4EDF5',  // Azul hielo claro para píldoras e insignias
          200: '#CBDCEB',  // Azul suave para bordes sutiles
          300: '#A8C4DD',  // Azul acero claro
          400: '#7DA5C9',  // Azul acero medio
          500: '#5A88B5',  // Azul cívico cálido
          600: '#48739E',  // Azul acero representativo (Botones principales)
          700: '#395E83',  // Azul pizarra noble (Pestañas activas y titulares)
          800: '#2C4967',  // Azul marino barrial (Cabeceras de modales)
          900: '#1F344B',  // Azul noche cívico (Barra de cabecera)
          950: '#122030',  // Contraste profundo
        },
        brand: {
          50: '#F2F6FA',
          100: '#E4EDF5',
          200: '#CBDCEB',
          300: '#A8C4DD',
          400: '#7DA5C9',
          500: '#5A88B5',
          600: '#48739E',
          700: '#395E83',
          800: '#2C4967',
          900: '#1F344B',
        },
        emergency: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-up': 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}