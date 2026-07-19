/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scans App.js and everything under src/ (screens, navigation, lib).
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ZivaDzidzo's Graphite/Sky Mint palette. The app remains dark-first, with light
      // surfaces used deliberately for focused workflows such as authentication.
      colors: {
        graphite: "#25272C",
        "sky-mint": "#B8F7E4",
        "deep-teal": "#0F766E",
        bg: "#25272C",
        surface: "#303238",
        surface2: "#3A3D44",
        border: "#50545C",
        ink: "#F7FAF9",
        "ink-muted": "#C9D4D0",
        "ink-faint": "#919B98",
        // Legacy token name kept so existing moderate-risk cards do not break. The
        // actual value is blue; orange is reserved for ChiedzaAI-only brand moments.
        gold: "#38BDF8",
        teal: "#B8F7E4",
        blue: "#2563EB",
        red: "#E5484D",
        indigo: "#6C7CFF",
        violet: "#A881FF",
        cyan: "#2DC5DB",
      },
      // RN needs one font-family name per weight (no CSS font-weight cascading), loaded via
      // @expo-google-fonts/* in App.js. See src/theme/typography.js for the canonical map.
      fontFamily: {
        display: ["SpaceGrotesk_700Bold"],
        "display-semibold": ["SpaceGrotesk_600SemiBold"],
        body: ["Inter_500Medium"],
        "body-semibold": ["Inter_600SemiBold"],
        "body-bold": ["Inter_700Bold"],
        mono: ["IBMPlexMono_400Regular"],
        "mono-medium": ["IBMPlexMono_500Medium"],
        "mono-semibold": ["IBMPlexMono_600SemiBold"],
      },
    },
  },
  plugins: [],
}
