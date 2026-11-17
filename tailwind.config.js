/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          '"Noto Sans TC"',
          'sans-serif'
        ],
        kai: [
          '"BiauKai"',
          '"DFKai-SB"',
          '"Kaiti TC"',
          '"STKaiti"',
          '"TW-Kai"',
          'serif'
        ]
      }
    },
  },
  plugins: [],
};
