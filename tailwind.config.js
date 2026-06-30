/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2C2C2C',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F5A800',
          foreground: '#1A1A1A',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        muted: {
          DEFAULT: '#F4F4F4',
          foreground: '#777777',
        },
        border: '#E5E5E5',
        background: '#F7F7F7',
        foreground: '#1A1A1A',
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#EBEBEB',
          foreground: '#333333',
        },
        ring: '#F5A800',
        input: '#E5E5E5',
      }
    },
  },
  plugins: [],
}
