/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kopitiam: {
          red: '#F43F5E',
          deepred: '#E11D48',
          orange: '#FB7185',
          amber: '#F472B6',
          pandan: '#10B981',
          pandandark: '#059669',
          kopi: '#881337',
          kopilight: '#BE123C',
          cream: '#FFF8FA',
          card: '#FFFFFF',
          dark: '#1E293B'
        },
        rosepink: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(244, 63, 94, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'float': '0 12px 30px -4px rgba(244, 63, 94, 0.25)',
        'glow-red': '0 0 20px rgba(244, 63, 94, 0.4), 0 0 50px rgba(236, 72, 153, 0.2)',
        'glow-pink': '0 0 24px rgba(244, 63, 94, 0.35), 0 0 48px rgba(236, 72, 153, 0.18)',
        'glow-amber': '0 0 20px rgba(244, 114, 182, 0.3)',
        'glass': '0 8px 32px 0 rgba(244, 63, 94, 0.06)',
        'lift': '0 16px 36px -6px rgba(244, 63, 94, 0.12)',
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-up-modal': 'slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.4s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'spin-slow': 'spin 3s linear infinite',
        'radar-sweep': 'radarSweep 2s ease-in-out infinite',
        'count-up': 'countUp 0.4s ease-out both',
        'ring-fill': 'ringFill 1s cubic-bezier(0.16, 1, 0.3, 1) both',
        'bar-fill': 'barFill 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUpModal: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(244, 63, 94, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(244, 63, 94, 0.6), 0 0 50px rgba(236, 72, 153, 0.25)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ringFill: {
          '0%': { strokeDashoffset: '402' },
        },
        barFill: {
          '0%': { width: '0%' },
        },
        radarSweep: {
          '0%': { top: '5%', opacity: '0.8' },
          '50%': { top: '90%', opacity: '1' },
          '100%': { top: '5%', opacity: '0.8' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.92' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
