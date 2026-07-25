/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF7F2', paper: '#FFFFFF', ink: '#22303F', navy: '#1F3550',
        blue: '#4A6FA5', terra: '#C0564A', 'terra-soft': '#F7E9E6',
        sage: '#5B7A5E', 'sage-soft': '#EAF1EB',
        amber: '#B98A2F', 'amber-soft': '#FAF3E3', grey: '#66788C', line: '#E6DED4'
      },
      fontFamily: { serif: ['Georgia', 'serif'] }
    }
  },
  plugins: []
}
