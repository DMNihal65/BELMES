/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'custom': ['CustomFont', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      colors: {
        'sky': {
          '50': '#f0f9ff',
          '100': '#e0f2fe',
          '200': '#bae6fd',
          '300': '#7dd3fc',
          '400': '#38bdf8',
          '500': '#0ea5e9',
          '600': '#0284c7',
          '700': '#0369a1',
          '800': '#075985',
          '900': '#0c4a6e',
          '950': '#082f49',
        },
        'pale-sky': {
          '50': '#f7f8f8',
          '100': '#edeef1',
          '200': '#d8dbdf',
          '300': '#b6bac3',
          '400': '#8e95a2',
          '500': '#6b7280',
          '600': '#5b616e',
          '700': '#4a4e5a',
          '800': '#40444c',
          '900': '#383a42',
          '950': '#25272c',
        },
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}