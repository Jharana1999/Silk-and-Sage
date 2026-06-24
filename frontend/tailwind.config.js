/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  "#F2F5F0",
          100: "#E0EAD8",
          200: "#C2D5BB",
          300: "#9ABF92",
          400: "#7AA36E",
          500: "#6B8F5E",
          600: "#4A6741",
          700: "#3D5535",
          800: "#2E4028",
          900: "#1E2B1A",
        },
        gold: {
          50:  "#FBF6EC",
          100: "#F5E9CD",
          200: "#EDD5A0",
          300: "#E0BC70",
          400: "#D4A448",
          500: "#C4A464",
          600: "#B08940",
          700: "#8C6C2E",
          800: "#664F20",
          900: "#4A3714",
        },
        cream: {
          50:  "#FDFAF6",
          100: "#F9F4EE",
          200: "#F3E9DC",
          300: "#ECDBC8",
          400: "#E2CBB0",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans:  ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":    "fadeIn 0.6s ease-out forwards",
        "slide-up":   "slideUp 0.5s ease-out forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:   { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown: { "0%": { opacity: "0", transform: "translateY(-10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      boxShadow: {
        luxury: "0 4px 24px rgba(107, 143, 94, 0.12), 0 1px 6px rgba(0, 0, 0, 0.06)",
        card:   "0 2px 12px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 32px rgba(107, 143, 94, 0.18)",
      },
    },
  },
  plugins: [],
};
