/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#020617",
        },
      },
      boxShadow: {
        soft: "0 10px 40px rgba(2, 6, 23, 0.08)",
      },
    },
  },
  plugins: [],
};
