import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          DEFAULT: '#4B3621',
          900: '#2C1A11',
        },
        mocha: '#6F4E37',
        cream: '#F5F5DC',
        gold: '#C5A059',
      },
      // HERE IS THE FONT CONFIGURATION
      fontFamily: {
        // Matches the 'variable' names in layout.tsx
        serif: ['var(--font-playfair)', 'serif'], 
        sans: ['var(--font-montserrat)', 'sans-serif'],
        handwriting: ['var(--font-caveat)', 'cursive'],
      },
    },
  },
  plugins: [],
};
export default config;