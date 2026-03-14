/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F0',
        primary: '#1E293B', // Dark Navy/Slate
        secondary: '#64748B', // Muted Blue/Grey
        accent: '#94A3B8', // Soft Blue
        'soft-blue': '#E2E8F0', // Very light blue for backgrounds
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Helvetica Now Display', 'Inter', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '2rem',
      },
    },
  },
  plugins: [],
}
