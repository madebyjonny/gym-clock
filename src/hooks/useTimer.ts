/**
 * useTimer Hook
 * ==============
 * A comprehensive timer hook for CrossFit-style workouts supporting multiple timer modes.
 *
 * ## Architecture
 * Uses React's useReducer pattern for predictable state management. All state changes
 * flow through the reducer, making the timer logic easy to test and debug.
 *
 * ## Timer Modes
 * - **clock**: Simple wall clock display (no controls needed)
 * - **stopwatch**: Counts up indefinitely from 0:00
 * - **countdown**: Counts down from a set duration to 0:00
 * - **tabata**: Alternating work/rest intervals for N rounds (e.g., 20s work, 10s rest, 8 rounds)
 * - **emom**: "Every Minute On the Minute" - resets each minute for N total minutes
 * - **amrap**: "As Many Rounds As Possible" - counts up for a set duration
 *
 * ## Countdown Intro
 * Before starting any workout (except clock and stopwatch), an optional countdown intro
 * can be displayed (e.g., 3-2-1-GO!). This gives the athlete time to get ready.
 * - Set `countdownIntro` to 0 to disable, or 3, 5, 10 seconds etc.
 * - While `isInCountdownIntro` is true, display `introTimeRemaining` (in ms)
 * - When intro reaches 0, the main workout timer begins automatically
 *
 * ## How Timing Works
 * Instead of incrementing by a fixed amount each tick, we measure the actual elapsed
 * time between ticks using Date.now(). This compensates for any drift or delays in
 * JavaScript's setInterval, ensuring accurate timing even if the device is under load.
 *
 * The interval runs every 10ms for smooth display updates (especially for the
 * milliseconds/centiseconds display in stopwatch mode).
 *
 * ## State Shape
 * @see TimerState in ../types
 * - mode: Current timer mode
 * - isRunning: Whether the timer is actively counting
 * - currentTime: Elapsed time in milliseconds (always counts UP internally)
 * - countdown/tabata/emom/amrap: Settings objects for each mode
 * - currentRound: Current round number (tabata)
 * - isWorkPhase: Whether in work or rest phase (tabata)
 * - currentMinute: Current minute number (emom)
 * - countdownIntro: Intro duration in seconds (0 = disabled)
 * - isInCountdownIntro: True while the intro countdown is active
 * - introTimeRemaining: Milliseconds remaining in intro countdown
 *
 * ## Usage Example
 * ```tsx
 * const { state, toggle, reset, setMode, setTabata, setCountdownIntro } = useTimer();
 *
 * // Switch to Tabata mode
 * setMode('tabata');
 *
 * // Configure Tabata settings
 * setTabata({ workTime: 30, restTime: 15, rounds: 6 });
 *
 * // Set a 5-second countdown intro before workout starts
 * setCountdownIntro(5);
 *
 * // Start - will show 5-4-3-2-1 then begin workout
 * toggle();
 *
 * // Reset to initial state for current mode
 * reset();
 * ```
 */

import { useReducer, useCallback, useRef, useEffect } from "react";
import {
  TimerState,
  TimerMode,
  TabataSettings,
  EmomSettings,
  AmrapSettings,
  CountdownSettings,
} from "../types";

/**
 * All possible actions that can be dispatched to the timer reducer.
 * Using a discriminated union ensures type safety when handling actions.
 */
type TimerAction =
  | { type: "SET_MODE"; mode: TimerMode }
  | { type: "START" }
  | { type: "STOP" }
  | { type: "RESET" }
  | { type: "TICK"; delta: number } // delta = milliseconds since last tick
  | { type: "SET_COUNTDOWN"; settings: CountdownSettings }
  | { type: "SET_TABATA"; settings: TabataSettings }
  | { type: "SET_EMOM"; settings: EmomSettings }
  | { type: "SET_AMRAP"; settings: AmrapSettings }
  | { type: "SET_COUNTDOWN_INTRO"; seconds: number };

/**
 * Default state when the hook initializes.
 * Starts in stopwatch mode with standard CrossFit defaults for other modes.
 */
const initialState: TimerState = {
  mode: "stopwatch",
  isRunning: false,
  currentTime: 0, // Always in milliseconds, always counts UP
  countdown: { totalTime: 180 }, // 3 minutes default
  tabata: { workTime: 20, restTime: 10, rounds: 8 }, // Classic Tabata protocol
  emom: { intervalTime: 60, totalMinutes: 10 },
  amrap: { totalTime: 600 }, // 10 minutes default
  currentRound: 1, // 1-indexed for display
  isWorkPhase: true, // Tabata starts with work phase
  currentMinute: 1, // 1-indexed for display
  // Countdown intro defaults
  countdownIntro: 10, // 3 second countdown before workout (0 = disabled)
  isInCountdownIntro: false,
  introTimeRemaining: 0,
};

/**
 * Timer Reducer
 * =============
 * Pure function that handles all state transitions.
 *
 * Key design decisions:
 * - currentTime always counts UP (even for countdown mode - we subtract from total to display)
 * - Mode changes reset all timing state to prevent stale data
 * - TICK action handles all the complex logic for different modes
 * - Countdown intro runs first (if enabled), then transitions to main workout
 */
function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    /**
     * SET_MODE: Switch between timer modes
     * Resets all timing state to prevent confusion when switching modes
     */
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        isRunning: false,
        currentTime: 0,
        currentRound: 1,
        isWorkPhase: true,
        currentMinute: 1,
        isInCountdownIntro: false,
        introTimeRemaining: 0,
      };

    /**
     * START: Begin counting
     * If countdown intro is enabled (and mode supports it), start with intro first
     */
    case "START": {
      const supportsIntro = !["clock", "stopwatch"].includes(state.mode);
      const hasIntro = state.countdownIntro > 0 && supportsIntro;

      // Only start intro if we're at the beginning (currentTime === 0)
      if (hasIntro && state.currentTime === 0) {
        return {
          ...state,
          isRunning: true,
          isInCountdownIntro: true,
          introTimeRemaining: state.countdownIntro * 1000,
        };
      }

      return { ...state, isRunning: true };
    }

    /** STOP: Pause counting (preserves current time for resume) */
    case "STOP":
      return { ...state, isRunning: false };

    /** RESET: Return to initial state for current mode */
    case "RESET":
      return {
        ...state,
        isRunning: false,
        currentTime: 0,
        currentRound: 1,
        isWorkPhase: true,
        currentMinute: 1,
        isInCountdownIntro: false,
        introTimeRemaining: 0,
      };

    /**
     * TICK: Core timing logic
     * Called every ~10ms while running. Handles intro countdown and mode-specific logic.
     *
     * @param delta - Actual milliseconds elapsed since last tick (not a fixed 10ms)
     */
    case "TICK": {
      // COUNTDOWN INTRO PHASE
      // If we're in the intro, count down until it reaches 0, then transition to main workout
      if (state.isInCountdownIntro) {
        const newIntroRemaining = state.introTimeRemaining - action.delta;

        if (newIntroRemaining <= 0) {
          // Intro complete - transition to main workout
          return {
            ...state,
            isInCountdownIntro: false,
            introTimeRemaining: 0,
            currentTime: 0, // Ensure main timer starts at 0
          };
        }

        return {
          ...state,
          introTimeRemaining: newIntroRemaining,
        };
      }

      // MAIN WORKOUT TIMING
      let newTime = state.currentTime + action.delta;
      let newState = { ...state, currentTime: newTime };

      // COUNTDOWN MODE
      // Check if we've reached zero (totalTime - currentTime <= 0)
      if (state.mode === "countdown") {
        const remaining = state.countdown.totalTime * 1000 - newTime;
        if (remaining <= 0) {
          // Timer complete - stop at exactly 0:00
          return {
            ...state,
            currentTime: state.countdown.totalTime * 1000,
            isRunning: false,
          };
        }
      }

      // TABATA MODE
      // Track work/rest phases and round progression
      if (state.mode === "tabata") {
        const { workTime, restTime, rounds } = state.tabata;
        const cycleTime = (workTime + restTime) * 1000; // One full work+rest cycle in ms

        // Calculate where we are within the current cycle
        const currentCycleTime = newTime % cycleTime;

        // Calculate current round (1-indexed)
        const currentRound = Math.floor(newTime / cycleTime) + 1;

        // Work phase = first part of cycle, rest phase = remainder
        const isWorkPhase = currentCycleTime < workTime * 1000;

        // Check if all rounds complete
        if (currentRound > rounds) {
          return {
            ...state,
            currentTime: rounds * cycleTime,
            isRunning: false,
            currentRound: rounds,
            isWorkPhase: false,
          };
        }

        newState = { ...newState, currentRound, isWorkPhase };
      }

      // EMOM MODE
      // Track minute progression
      if (state.mode === "emom") {
        const { totalMinutes } = state.emom;

        // Calculate current minute (1-indexed)
        const currentMinute = Math.floor(newTime / 60000) + 1;

        // Check if all minutes complete
        if (currentMinute > totalMinutes) {
          return {
            ...state,
            currentTime: totalMinutes * 60000,
            isRunning: false,
            currentMinute: totalMinutes,
          };
        }

        newState = { ...newState, currentMinute };
      }

      // AMRAP MODE
      // Simple countdown - stop when total time reached
      if (state.mode === "amrap") {
        const { totalTime } = state.amrap;
        if (newTime >= totalTime * 1000) {
          return { ...state, currentTime: totalTime * 1000, isRunning: false };
        }
      }

      return newState;
    }

    // Settings updates - these can be changed while timer is stopped
    case "SET_COUNTDOWN":
      return { ...state, countdown: action.settings };
    case "SET_TABATA":
      return { ...state, tabata: action.settings };
    case "SET_EMOM":
      return { ...state, emom: action.settings };
    case "SET_AMRAP":
      return { ...state, amrap: action.settings };

    /**
     * SET_COUNTDOWN_INTRO: Set the intro countdown duration
     * @param seconds - Duration in seconds (0 = disabled, typically 3, 5, or 10)
     */
    case "SET_COUNTDOWN_INTRO":
      return { ...state, countdownIntro: action.seconds };

    default:
      return state;
  }
}

/**
 * useTimer Hook
 * =============
 * Main export - provides timer state and control functions.
 *
 * @returns {Object} Timer API
 * @returns {TimerState} state - Current timer state
 * @returns {Function} start - Start the timer
 * @returns {Function} stop - Stop/pause the timer
 * @returns {Function} reset - Reset timer to 0
 * @returns {Function} toggle - Toggle between start/stop
 * @returns {Function} setMode - Change timer mode
 * @returns {Function} setCountdown - Update countdown settings
 * @returns {Function} setTabata - Update tabata settings
 * @returns {Function} setEmom - Update emom settings
 * @returns {Function} setAmrap - Update amrap settings
 */
export function useTimer() {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  // Refs for interval management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0); // Timestamp of last tick for delta calculation

  /**
   * Timer Loop Effect
   * Manages the setInterval that drives the timer.
   *
   * Why we use delta timing:
   * setInterval(fn, 10) doesn't guarantee exactly 10ms between calls.
   * By measuring actual elapsed time, we stay accurate even if the
   * device is busy or the app was backgrounded briefly.
   */
  useEffect(() => {
    if (state.isRunning) {
      // Record start time for first delta calculation
      lastTickRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current; // Actual ms elapsed
        lastTickRef.current = now;
        dispatch({ type: "TICK", delta });
      }, 10); // 10ms = 100fps update rate for smooth display
    } else {
      // Clean up interval when stopped
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning]);

  // Memoized action dispatchers
  const start = useCallback(() => dispatch({ type: "START" }), []);
  const stop = useCallback(() => dispatch({ type: "STOP" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const toggle = useCallback(() => {
    if (state.isRunning) {
      dispatch({ type: "STOP" });
    } else {
      dispatch({ type: "START" });
    }
  }, [state.isRunning]);

  const setMode = useCallback(
    (mode: TimerMode) => dispatch({ type: "SET_MODE", mode }),
    []
  );

  const setCountdown = useCallback(
    (settings: CountdownSettings) =>
      dispatch({ type: "SET_COUNTDOWN", settings }),
    []
  );

  const setTabata = useCallback(
    (settings: TabataSettings) => dispatch({ type: "SET_TABATA", settings }),
    []
  );

  const setEmom = useCallback(
    (settings: EmomSettings) => dispatch({ type: "SET_EMOM", settings }),
    []
  );

  const setAmrap = useCallback(
    (settings: AmrapSettings) => dispatch({ type: "SET_AMRAP", settings }),
    []
  );

  /**
   * Set the countdown intro duration
   * @param seconds - Duration in seconds (0 = disabled, typically 3, 5, or 10)
   */
  const setCountdownIntro = useCallback(
    (seconds: number) => dispatch({ type: "SET_COUNTDOWN_INTRO", seconds }),
    []
  );

  return {
    state,
    start,
    stop,
    reset,
    toggle,
    setMode,
    setCountdown,
    setTabata,
    setEmom,
    setAmrap,
    setCountdownIntro,
  };
}
