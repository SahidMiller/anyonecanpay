module.exports = {
  content: ["./index.html", "./src/**/*.{html,jsx}"],
  // safelist: process.env.NODE_ENV === "development" ? [{ pattern: /.*/ }]  : [],
  theme: {
    screens: {
      'xs': '380px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {},
  },
  variants: {
    extend: {
      backgroundColor: ["group-hover"],
      hidden: ["group-focus-within"]
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require("daisyui")
  ],
}
