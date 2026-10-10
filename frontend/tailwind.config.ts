import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1A1A1A",
        secondary: "#6B6259",
        leaf: "#1B8A5A",
        teal: "#0F6B5C",
        voice: "#E8674B",
        gold: "#B8925A",
        wheat: "#FAF7F2",
        clay: "#C0392B",
        mist: "#F4EFE8",
        line: "#E8E1D8",
      },
      boxShadow: {
        soft: "0 22px 70px rgba(49, 35, 24, 0.13)",
        phone: "0 32px 90px rgba(49, 35, 24, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
