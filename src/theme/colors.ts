export const colors = {
  // Background colors
  background: "#000000",
  surfaceDark: "#0a0a0a",
  surface: "#111111",

  // LCD segment colors
  segmentOff: "#1a1a1a", // Faded grey for "off" segments
  segmentOffLight: "#222222",

  // Active segment colors (bright with glow)
  red: "#ff0000",
  redGlow: "rgba(255, 0, 0, 0.6)",
  redDim: "#330000",

  blue: "#0088ff",
  blueGlow: "rgba(0, 136, 255, 0.6)",
  blueDim: "#001a33",

  green: "#00ff00",
  greenGlow: "rgba(0, 255, 0, 0.6)",
  greenDim: "#003300",

  yellow: "#ffff00",
  yellowGlow: "rgba(255, 255, 0, 0.6)",
  yellowDim: "#333300",

  white: "#ffffff",
  whiteGlow: "rgba(255, 255, 255, 0.6)",

  // UI colors
  textPrimary: "#ffffff",
  textSecondary: "#888888",
  textMuted: "#444444",

  // Button colors
  buttonPrimary: "#ff0000",
  buttonSecondary: "#333333",
  buttonDisabled: "#222222",
};

export const shadows = {
  redGlow: {
    textShadowColor: colors.redGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  blueGlow: {
    textShadowColor: colors.blueGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  greenGlow: {
    textShadowColor: colors.greenGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  yellowGlow: {
    textShadowColor: colors.yellowGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
};
