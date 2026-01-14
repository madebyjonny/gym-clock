import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import {
  TimerMode,
  TimerState,
  TabataSettings,
  EmomSettings,
  AmrapSettings,
  CountdownSettings,
} from "../types";
import { colors } from "../theme/colors";
import { LCDDisplay } from "./LCDDisplay";
import {
  formatStopwatch,
  formatCountdown,
  formatTabata,
  formatEmom,
  formatAmrap,
  formatClock,
  formatIntroCountdown,
} from "../utils/timeFormat";

interface PortraitSettingsProps {
  state: TimerState;
  onModeChange: (mode: TimerMode) => void;
  onCountdownChange: (settings: CountdownSettings) => void;
  onTabataChange: (settings: TabataSettings) => void;
  onEmomChange: (settings: EmomSettings) => void;
  onAmrapChange: (settings: AmrapSettings) => void;
  onCountdownIntroChange: (seconds: number) => void;
  onStart: () => void;
  onReset: () => void;
}

const MODES: { value: TimerMode; label: string }[] = [
  { value: "clock", label: "Clock" },
  { value: "stopwatch", label: "Stopwatch" },
  { value: "countdown", label: "Timer" },
  { value: "tabata", label: "Tabata" },
  { value: "emom", label: "EMOM" },
  { value: "amrap", label: "AMRAP" },
];

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (value: number) => string;
}

function NumberPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  format,
}: NumberPickerProps) {
  const displayValue = format ? format(value) : value.toString();

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerControls}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => onChange(Math.max(min, value - step))}
        >
          <Text style={styles.pickerButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.pickerValue}>{displayValue}</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => onChange(Math.min(max, value + step))}
        >
          <Text style={styles.pickerButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PortraitSettings({
  state,
  onModeChange,
  onCountdownChange,
  onTabataChange,
  onEmomChange,
  onAmrapChange,
  onCountdownIntroChange,
  onStart,
  onReset,
}: PortraitSettingsProps) {
  const [clockTime, setClockTime] = useState(formatClock());
  const { width } = Dimensions.get("window");

  // Update clock time every second when in clock mode
  useEffect(() => {
    if (state.mode === "clock") {
      const interval = setInterval(() => {
        setClockTime(formatClock());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.mode]);

  const getDisplayTime = (): {
    time: string;
    sub?: { left: string; right: string };
    color: "red" | "blue" | "green" | "yellow";
  } => {
    // Show countdown intro if active
    if (state.isInCountdownIntro) {
      return {
        time: formatIntroCountdown(state),
        sub: { left: "GET READY", right: "" },
        color: "yellow",
      };
    }

    switch (state.mode) {
      case "clock":
        return { time: clockTime, color: "blue" };
      case "stopwatch":
        return { time: formatStopwatch(state), color: "red" };
      case "countdown":
        return { time: formatCountdown(state), color: "red" };
      case "tabata": {
        const tabata = formatTabata(state);
        return {
          time: tabata.time,
          sub: { left: tabata.phase, right: tabata.round },
          color: state.isWorkPhase ? "green" : "red",
        };
      }
      case "emom": {
        const emom = formatEmom(state);
        return {
          time: emom.time,
          sub: { left: "EMOM", right: emom.minute },
          color: "blue",
        };
      }
      case "amrap":
        return {
          time: formatAmrap(state),
          sub: { left: "AMRAP", right: "" },
          color: "yellow",
        };
      default:
        return { time: "00:00", color: "red" };
    }
  };

  const display = getDisplayTime();
  const showControls = state.mode !== "clock";
  const clockFontSize = Math.min(width * 0.22, 140);

  const colorMap = {
    red: colors.red,
    blue: colors.blue,
    green: colors.green,
    yellow: colors.yellow,
  };

  const renderSettings = () => {
    switch (state.mode) {
      case "countdown":
        return (
          <NumberPicker
            value={state.countdown.totalTime}
            onChange={(v) => onCountdownChange({ totalTime: v })}
            min={10}
            max={3600}
            step={10}
            label="Duration"
            format={formatSeconds}
          />
        );

      case "tabata":
        return (
          <>
            <NumberPicker
              value={state.tabata.workTime}
              onChange={(v) => onTabataChange({ ...state.tabata, workTime: v })}
              min={5}
              max={120}
              step={5}
              label="Work"
              format={formatSeconds}
            />
            <NumberPicker
              value={state.tabata.restTime}
              onChange={(v) => onTabataChange({ ...state.tabata, restTime: v })}
              min={5}
              max={120}
              step={5}
              label="Rest"
              format={formatSeconds}
            />
            <NumberPicker
              value={state.tabata.rounds}
              onChange={(v) => onTabataChange({ ...state.tabata, rounds: v })}
              min={1}
              max={50}
              step={1}
              label="Rounds"
            />
          </>
        );

      case "emom":
        return (
          <NumberPicker
            value={state.emom.totalMinutes}
            onChange={(v) => onEmomChange({ ...state.emom, totalMinutes: v })}
            min={1}
            max={60}
            step={1}
            label="Minutes"
          />
        );

      case "amrap":
        return (
          <NumberPicker
            value={state.amrap.totalTime}
            onChange={(v) => onAmrapChange({ totalTime: v })}
            min={60}
            max={3600}
            step={60}
            label="Duration"
            format={formatSeconds}
          />
        );

      default:
        return null;
    }
  };

  // Render the countdown intro picker (shared across modes that support it)
  const renderIntroSetting = () => {
    const supportsIntro = !["clock", "stopwatch"].includes(state.mode);
    if (!supportsIntro) return null;

    return (
      <NumberPicker
        value={state.countdownIntro}
        onChange={onCountdownIntroChange}
        min={0}
        max={10}
        step={1}
        label="Start Delay"
        format={(v) => `0:${v.toString().padStart(2, "0")}`}
      />
    );
  };

  const hasSettings = ["countdown", "tabata", "emom", "amrap"].includes(
    state.mode
  );
  const hasIntroSetting = !["clock", "stopwatch"].includes(state.mode);

  return (
    <View style={styles.container}>
      {/* Clock Preview Area - Takes up top half */}
      <View style={styles.clockPreview}>
        <View style={styles.clockContainer}>
          <View style={styles.subDisplayRow}>
            <Text
              style={[
                styles.subText,
                {
                  color: display.sub ? colorMap[display.color] : "transparent",
                },
              ]}
            >
              {display.sub?.left || ""}
            </Text>
            <Text
              style={[
                styles.subText,
                {
                  color: display.sub ? colorMap[display.color] : "transparent",
                },
              ]}
            >
              {display.sub?.right || ""}
            </Text>
          </View>
          <LCDDisplay
            value={display.time}
            color={display.color}
            fontSize={clockFontSize}
          />
        </View>
      </View>

      {/* Bottom Controls Area - Fixed at bottom */}
      <View style={styles.bottomControls}>
        {/* Mode Selector - Segmented Control Style */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.segmentedControl}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.segment,
                  state.mode === mode.value && styles.segmentActive,
                ]}
                onPress={() => onModeChange(mode.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    state.mode === mode.value && styles.segmentTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings Panel - Fixed height container */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionLabel}>Settings</Text>
          <ScrollView>
            {hasSettings || hasIntroSetting ? (
              <>
                <View style={styles.settingsCard}>
                  {renderSettings()}
                  {renderIntroSetting()}
                </View>
              </>
            ) : (
              <View style={styles.settingsPlaceholder} />
            )}
          </ScrollView>
        </View>

        {/* Control Buttons - Always at bottom */}
        <View style={styles.controlArea}>
          {showControls ? (
            <>
              <TouchableOpacity
                style={[
                  styles.mainButton,
                  state.isRunning && styles.mainButtonStop,
                ]}
                onPress={onStart}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    state.isRunning && styles.mainButtonTextStop,
                  ]}
                >
                  {state.isRunning ? "Stop" : "Start"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={onReset}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
        </View>

        {/* Hint */}
        <View style={styles.hint}>
          <Text style={styles.hintText}>Rotate device for fullscreen</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  clockPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  clockContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subDisplayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 8,
    minWidth: 200,
    height: 28,
  },
  subText: {
    fontFamily: "Digital7Mono",
    fontSize: 24,
  },
  bottomControls: {
    height: "70%",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  section: {
    marginBottom: 16,
  },
  settingsSection: {
    flex: 1,
    marginBottom: 16,
  },
  settingsPlaceholder: {
    height: "30%",
  },
  sectionLabel: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    paddingVertical: 10,
    borderRadius: 8,
    width: "32%",
    flexGrow: 1,
    alignItems: "center",
    margin: 2,
  },
  segmentActive: {
    backgroundColor: colors.buttonSecondary,
  },
  segmentText: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  pickerLabel: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  pickerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pickerButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.buttonSecondary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  pickerValue: {
    fontFamily: "System",
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    minWidth: 70,
    textAlign: "center",
  },
  controlArea: {
    flexDirection: "row",
    paddingVertical: 16,
    gap: 12,
    minHeight: 64,
  },
  buttonPlaceholder: {
    height: 52,
  },
  mainButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  mainButtonStop: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  mainButtonText: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "600",
    color: colors.background,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  mainButtonTextStop: {
    color: colors.textSecondary,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.buttonSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  hint: {
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 8,
  },
  hintText: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "400",
    color: colors.textMuted,
  },
});
