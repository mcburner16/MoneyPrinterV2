import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ticketBlack: "#080607",
        ticketRed: "#7f101b",
        ticketGold: "#d6a640",
        theaterCard: "#151013"
      }
    }
  },
  plugins: []
};

export default config;
