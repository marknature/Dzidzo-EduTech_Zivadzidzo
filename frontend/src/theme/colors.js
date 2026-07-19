// Plain hex values for contexts that can't use NativeWind className (react-native-svg
// stroke/fill props, inline style objects). Keep in sync with tailwind.config.js colors -
// that file is the source of truth for anything reachable via className.
export const colors = {
  // ZivaDzidzo's core palette. Graphite gives the product its calm, institutional
  // foundation; Sky Mint is reserved for clear, optimistic calls to action.
  graphite: "#25272C",
  skyMint: "#B8F7E4",
  deepTeal: "#0F766E",
  bg: "#25272C",
  surface: "#303238",
  surface2: "#3A3D44",
  border: "#50545C",
  ink: "#F7FAF9",
  inkMuted: "#C9D4D0",
  inkFaint: "#919B98",
  // Compatibility alias for existing moderate-risk components. It intentionally uses
  // blue now so amber/orange is not a primary ZivaDzidzo interaction colour.
  gold: "#38BDF8",
  teal: "#B8F7E4",
  // A darker blue is used for text links and secondary actions on light surfaces.
  blue: "#2563EB",
  red: "#E5484D",
  indigo: "#6C7CFF",
  violet: "#A881FF",
  cyan: "#2DC5DB",
};
