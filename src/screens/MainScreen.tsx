import React, { useState, useEffect } from "react";
import { View, StyleSheet, StatusBar, Dimensions } from "react-native";
import { useFonts } from "expo-font";
import * as ScreenOrientation from "expo-screen-orientation";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useTimer } from "../hooks/useTimer";
import { LandscapeClock } from "../components/LandscapeClock";
import { PortraitSettings } from "../components/PortraitSettings";
import { colors } from "../theme/colors";

export default function MainScreen() {
  const [isLandscape, setIsLandscape] = useState(false);
  const timer = useTimer();

  const [fontsLoaded] = useFonts({
    Digital7Mono: require("../../assets/fonts/Digital7Mono.ttf"),
    Technology: require("../../assets/fonts/Technology.ttf"),
    "Technology-Bold": require("../../assets/fonts/Technology-Bold.ttf"),
  });

  useEffect(() => {
    // Enable all orientations
    ScreenOrientation.unlockAsync();

    // Check initial orientation
    const checkOrientation = async () => {
      const orientation = await ScreenOrientation.getOrientationAsync();
      setIsLandscape(
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    };

    checkOrientation();

    // Listen for orientation changes
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        const orientation = event.orientationInfo.orientation;
        setIsLandscape(
          orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
            orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        );
      }
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  // Keep screen awake when timer is running or in landscape
  useEffect(() => {
    if (timer.state.isRunning || isLandscape) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
  }, [timer.state.isRunning, isLandscape]);

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={isLandscape} barStyle="light-content" />

      {isLandscape ? (
        <LandscapeClock
          state={timer.state}
          onToggle={timer.toggle}
          onReset={timer.reset}
        />
      ) : (
        <PortraitSettings
          state={timer.state}
          onModeChange={timer.setMode}
          onCountdownChange={timer.setCountdown}
          onTabataChange={timer.setTabata}
          onEmomChange={timer.setEmom}
          onAmrapChange={timer.setAmrap}
          onStart={timer.toggle}
          onReset={timer.reset}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
