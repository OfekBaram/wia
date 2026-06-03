import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wia: {
          // Light theme — soft off-white background, deep purple-black ink
          bg:        '#FAFAFB',  // page background (very subtle warm white)
          surface:   '#FFFFFF',  // raised surfaces / cards
          card:      '#FFFFFF',
          border:    '#E0DDE9',  // hairline borders
          ink:       '#1A1430',  // primary text (deep purple-black for warmth)
          'ink-soft':'#6E6884',  // secondary text
          'ink-dim': '#A29DB4',  // muted / placeholder
          // Brand accent colors (unchanged — they pop on light bg too)
          purple:    '#8B5CF6',
          pink:      '#EC4899',
          cyan:      '#06B6D4',
          green:     '#10B981',
          amber:     '#F59E0B',
        },
      },
      fontFamily: {
        sans:     ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display:  ['var(--font-space)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:        '0 2px 12px -2px rgba(26, 20, 48, 0.06), 0 4px 24px -8px rgba(26, 20, 48, 0.08)',
        'soft-lg':   '0 4px 24px -4px rgba(26, 20, 48, 0.08), 0 12px 40px -12px rgba(26, 20, 48, 0.12)',
        'soft-xl':   '0 8px 40px -8px rgba(26, 20, 48, 0.12), 0 24px 64px -24px rgba(26, 20, 48, 0.18)',
        'glow-purple': '0 4px 20px -4px rgba(139, 92, 246, 0.35)',
        'glow-pink':   '0 4px 20px -4px rgba(236, 72, 153, 0.35)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'float-delay':  'float 6s ease-in-out 2s infinite',
        'float-delay2': 'float 6s ease-in-out 4s infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'slide-up':     'slideUp 0.6s ease-out',
        'fade-in':      'fadeIn 0.8s ease-out',
        'scale-in':     'scaleIn 0.4s ease-out',
        'ping-slow':    'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-16px)' },
        },
        glow: {
          '0%':   { opacity: '0.5', filter: 'blur(20px)' },
          '100%': { opacity: '0.8', filter: 'blur(30px)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
