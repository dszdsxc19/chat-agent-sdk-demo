import assistantUI from '@assistant-ui/react-ui/tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../node_modules/@assistant-ui/react-ui/**/*.{js,jsx,ts,tsx}",
    // also check local node_modules in case of pnpm hoisting differences
    "./node_modules/@assistant-ui/react-ui/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [assistantUI(), tailwindcssAnimate],
}
