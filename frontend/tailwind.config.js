const defaultTheme = require("tailwindcss/defaultTheme");
const {nextui} = require("@nextui-org/react");


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", 
    "./pages/**/*.{js,ts,jsx,tsx}", 
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
    },
    extend: {
      dropShadow: {
        cta: ["0 10px 15px rgba(219, 227, 248, 0.2)"],
        blue: ["0 10px 15px rgba(59, 130, 246, 0.2)"],
      },
      colors: {
        lightBG: '#202023',
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui(),
    // require("@tailwindcss/forms")
  ],
};
