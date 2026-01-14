import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LCDDisplay } from "./LCDDisplay";
import { TimerState, TimerMode } from "../types";
import {
  formatStopwatch,
  formatCountdown,
  formatTabata,
  formatEmom,
  formatAmrap,
  formatClock,
  formatIntroCountdown,
} from "../utils/timeFormat";
import { colors, shadows } from "../theme/colors";

interface LandscapeClockProps {
  state: TimerState;
  onToggle: () => void;
  onReset: () => void;
}

export function LandscapeClock({
  state,
  onToggle,
  onReset,
}: LandscapeClockProps) {
  const [clockTime, setClockTime] = useState(formatClock());
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Update clock time every second when in clock mode
  useEffect(() => {
    if (state.mode === "clock") {
      const interval = setInterval(() => {
        setClockTime(formatClock());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.mode]);

  const getDisplayContent = () => {
    // Show countdown intro if active
    if (state.isInCountdownIntro) {
      return {
        main: formatIntroCountdown(state),
        sub: { phase: "GET READY", round: "" },
        color: "yellow" as const,
        isIntro: true,
      };
    }

    switch (state.mode) {
      case "clock":
        return {
          main: clockTime,
          sub: null,
          color: "blue" as const,
          isIntro: false,
        };

      case "stopwatch":
        return {
          main: formatStopwatch(state),
          sub: null,
          color: "red" as const,
          isIntro: false,
        };

      case "countdown":
        return {
          main: formatCountdown(state),
          sub: null,
          color: "red" as const,
          isIntro: false,
        };

      case "tabata": {
        const tabata = formatTabata(state);
        const color = state.isWorkPhase ? ("green" as const) : ("red" as const);
        return {
          main: tabata.time,
          sub: { phase: tabata.phase, round: tabata.round },
          color,
          isIntro: false,
        };
      }

      case "emom": {
        const emom = formatEmom(state);
        return {
          main: emom.time,
          sub: { phase: "EMOM", round: emom.minute },
          color: "blue" as const,
          isIntro: false,
        };
      }

      case "amrap":
        return {
          main: formatAmrap(state),
          sub: { phase: "AMRAP", round: "" },
          color: "yellow" as const,
          isIntro: false,
        };

      default:
        return {
          main: "00:00",
          sub: null,
          color: "red" as const,
          isIntro: false,
        };
    }
  };

  const display = getDisplayContent();
  const showControls = state.mode !== "clock";

  const clockFontSize = 250;
  const subFontSize = Math.max(28, clockFontSize * 0.22);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={showControls ? onToggle : undefined}
      onLongPress={showControls ? onReset : undefined}
      delayLongPress={500}
    >
      <View style={styles.displayContainer}>
        {display.sub && (
          <View style={styles.subDisplay}>
            <Text
              style={[
                styles.subText,
                {
                  fontSize: subFontSize,
                  color: colorMap[display.color].active,
                },
                shadows[`${display.color}Glow`],
              ]}
            >
              {display.sub.phase}
            </Text>
            <Text
              style={[
                styles.subText,
                {
                  fontSize: subFontSize,
                  color: colorMap[display.color].active,
                },
                shadows[`${display.color}Glow`],
              ]}
            >
              {display.sub.round || ""}
            </Text>
          </View>
        )}

        <LCDDisplay
          value={display.main}
          size="huge"
          color={display.color}
          fontSize={clockFontSize}
        />

        {showControls && (
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.runningDot,
                {
                  backgroundColor: state.isRunning ? colors.green : colors.red,
                },
              ]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const colorMap = {
  red: { active: colors.red },
  blue: { active: colors.blue },
  green: { active: colors.green },
  yellow: { active: colors.yellow },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  displayContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  subDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 800,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  subText: {
    fontFamily: "Digital7Mono",
  },
  statusIndicator: {
    marginTop: 24,
    alignItems: "center",
  },
  runningDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
