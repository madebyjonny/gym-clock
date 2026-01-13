import { useReducer, useCallback, useRef, useEffect } from "react";
import {
  TimerState,
  TimerMode,
  TabataSettings,
  EmomSettings,
  AmrapSettings,
  CountdownSettings,
} from "../types";

type TimerAction =
  | { type: "SET_MODE"; mode: TimerMode }
  | { type: "START" }
  | { type: "STOP" }
  | { type: "RESET" }
  | { type: "TICK"; delta: number }
  | { type: "SET_COUNTDOWN"; settings: CountdownSettings }
  | { type: "SET_TABATA"; settings: TabataSettings }
  | { type: "SET_EMOM"; settings: EmomSettings }
  | { type: "SET_AMRAP"; settings: AmrapSettings };

const initialState: TimerState = {
  mode: "stopwatch",
  isRunning: false,
  currentTime: 0,
  countdown: { totalTime: 180 }, // 3 minutes default
  tabata: { workTime: 20, restTime: 10, rounds: 8 },
  emom: { intervalTime: 60, totalMinutes: 10 },
  amrap: { totalTime: 600 }, // 10 minutes default
  currentRound: 1,
  isWorkPhase: true,
  currentMinute: 1,
};

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        isRunning: false,
        currentTime: 0,
        currentRound: 1,
        isWorkPhase: true,
        currentMinute: 1,
      };
    case "START":
      return { ...state, isRunning: true };
    case "STOP":
      return { ...state, isRunning: false };
    case "RESET":
      return {
        ...state,
        isRunning: false,
        currentTime: 0,
        currentRound: 1,
        isWorkPhase: true,
        currentMinute: 1,
      };
    case "TICK": {
      let newTime = state.currentTime + action.delta;
      let newState = { ...state, currentTime: newTime };

      if (state.mode === "countdown") {
        const remaining = state.countdown.totalTime * 1000 - newTime;
        if (remaining <= 0) {
          return {
            ...state,
            currentTime: state.countdown.totalTime * 1000,
            isRunning: false,
          };
        }
      }

      if (state.mode === "tabata") {
        const { workTime, restTime, rounds } = state.tabata;
        const cycleTime = (workTime + restTime) * 1000;
        const currentCycleTime = newTime % cycleTime;
        const currentRound = Math.floor(newTime / cycleTime) + 1;
        const isWorkPhase = currentCycleTime < workTime * 1000;

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

      if (state.mode === "emom") {
        const { totalMinutes } = state.emom;
        const currentMinute = Math.floor(newTime / 60000) + 1;

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

      if (state.mode === "amrap") {
        const { totalTime } = state.amrap;
        if (newTime >= totalTime * 1000) {
          return { ...state, currentTime: totalTime * 1000, isRunning: false };
        }
      }

      return newState;
    }
    case "SET_COUNTDOWN":
      return { ...state, countdown: action.settings };
    case "SET_TABATA":
      return { ...state, tabata: action.settings };
    case "SET_EMOM":
      return { ...state, emom: action.settings };
    case "SET_AMRAP":
      return { ...state, amrap: action.settings };
    default:
      return state;
  }
}

export function useTimer() {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (state.isRunning) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        dispatch({ type: "TICK", delta });
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning]);

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
  };
}
