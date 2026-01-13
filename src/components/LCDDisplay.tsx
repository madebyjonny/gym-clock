import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, shadows } from "../theme/colors";

interface LCDDisplayProps {
  value: string;
  size?: "small" | "medium" | "large" | "xlarge" | "huge";
  color?: "red" | "blue" | "green" | "yellow";
  showBackground?: boolean;
  fontSize?: number;
}

const sizeMap = {
  small: 28,
  medium: 48,
  large: 72,
  xlarge: 120,
  huge: 160,
};

const colorMap = {
  red: { active: colors.red, glow: shadows.redGlow },
  blue: { active: colors.blue, glow: shadows.blueGlow },
  green: { active: colors.green, glow: shadows.greenGlow },
  yellow: { active: colors.yellow, glow: shadows.yellowGlow },
};

// Generate the background "88:88:88" pattern to show all segments
function getBackgroundPattern(value: string): string {
  return value.replace(/[0-9]/g, "8");
}

export function LCDDisplay({
  value,
  size = "large",
  color = "red",
  showBackground = true,
  fontSize: customFontSize,
}: LCDDisplayProps) {
  const fontSize = customFontSize ?? sizeMap[size];
  const colorStyle = colorMap[color];
  const backgroundPattern = getBackgroundPattern(value);

  const textStyle = [styles.text, { fontSize }];

  return (
    <View style={styles.container}>
      {/* Background layer - the faded "all segments on" look */}
      {showBackground && (
        <Text
          style={[...textStyle, { color: colors.segmentOff }]}
          numberOfLines={1}
        >
          {backgroundPattern}
        </Text>
      )}
      {/* Foreground layer - positioned exactly on top */}
      <Text
        style={[
          ...textStyle,
          styles.foreground,
          { color: colorStyle.active },
          colorStyle.glow,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  text: {
    fontFamily: "Digital7Mono",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  foreground: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
