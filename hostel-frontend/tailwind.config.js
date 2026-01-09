/** @type {import('tailwindcss').Config} */
const neutralScale = {
  50: "var(--tone-50)",
  100: "var(--tone-100)",
  200: "var(--tone-200)",
  300: "var(--tone-300)",
  400: "var(--tone-400)",
  500: "var(--tone-500)",
  600: "var(--tone-600)",
  700: "var(--tone-700)",
  800: "var(--tone-800)",
  900: "var(--tone-900)",
  950: "var(--tone-950)",
};

const accentScale = {
  50: "var(--tone-50)",
  100: "var(--tone-100)",
  200: "var(--tone-200)",
  300: "var(--tone-300)",
  400: "var(--tone-500)",
  500: "var(--tone-700)",
  600: "var(--primary)",
  700: "var(--foreground)",
  800: "var(--foreground)",
  900: "var(--foreground)",
  950: "var(--foreground)",
};

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        "muted-foreground": "var(--muted-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        ring: "var(--ring)",
        gray: neutralScale,
        blue: accentScale,
        indigo: accentScale,
        purple: accentScale,
        green: accentScale,
        emerald: accentScale,
        amber: accentScale,
        red: accentScale,
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 16px 40px -24px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
