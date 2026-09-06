import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0e0f14",
        panel: "#151722",
        panel2: "#1c1f2c",
        text1: "#f2f3f7",
        text2: "#a6a9b8",
        text3: "#6b6f80",
      },
    },
  },
  plugins: [],
};
export default config;
