import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          300: '#87a9ff',
          400: '#5478ff',
          500: '#2a4fff',
          600: '#1230e8',
          700: '#0e23c4',
          800: '#1120a0',
          900: '#131f7e',
          950: '#0b1250',
        },
        danger: {
          50:  '#fff1f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      screens: {
        xs: '360px',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
}

export default config
