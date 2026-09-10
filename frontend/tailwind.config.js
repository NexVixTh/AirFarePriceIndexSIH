/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Command Center Dark Theme
        cmd: {
          bg: '#060A13',         // Very dark navy canvas
          panel: '#0B132B',      // Secondary panel surface
          card: '#101B39',       // Elevated widget background
          cardHover: '#142247',  // Hover surface
          border: '#1B2A4A',     // Subtle dark border
          borderLight: '#2A3F6D',// Emphasized border
          borderHighlight: '#3B82F6', // Active glow border
          text: '#F8FAFC',       // Primary bright text
          subtext: '#94A3B8',    // Secondary slate text
          muted: '#64748B',      // Metadata caption text
        },
        // Rich Semantic Command Center Palette
        accent: {
          blue: '#3B82F6',       // Electric Blue (Primary National Index)
          blueGlow: '#60A5FA',
          cyan: '#06B6D4',       // Cyan (Secondary market information)
          teal: '#14B8A6',       // Teal (MoSPI CPI series)
          emerald: '#10B981',    // Emerald (Stable / Positive / Verified)
          saffron: '#F59E0B',    // Saffron / Amber (Elevated pressure)
          orange: '#F97316',     // Orange (Warning)
          red: '#EF4444',        // Red / Coral (Spike / Anomaly)
          purple: '#A855F7',     // Purple (DGCA Weights / Analytics)
          magenta: '#EC4899',    // Magenta (Highlighted Routes)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'panel': '0 2px 8px -2px rgba(0, 0, 0, 0.5), 0 1px 4px -1px rgba(0, 0, 0, 0.3)',
        'panel-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 2px 8px -2px rgba(59, 130, 246, 0.15)',
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 15px rgba(16, 185, 129, 0.3)',
        'glow-saffron': '0 0 15px rgba(245, 158, 11, 0.3)',
      }
    },
  },
  plugins: [],
}
