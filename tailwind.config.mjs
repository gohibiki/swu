/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Star Wars Unlimited colors â€” sampled from real cards
        'swu-blue':   '#0772B2',
        'swu-green':  '#62A43D',
        'swu-purple': '#734D90',
        'swu-red':    '#B60651',
        'swu-white':  '#FDFDFD'
      }
    }
  },
  plugins: []
};
