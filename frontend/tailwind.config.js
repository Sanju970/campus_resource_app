/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    "bg-purple-600",
    "bg-red-600",
    "bg-blue-600",
    "bg-gray-500",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
