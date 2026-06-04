/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    'row-span-1',
    'row-span-2',
    'row-span-3',
    'md:col-span-1',
    'md:col-span-2',
    'md:col-span-3',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
