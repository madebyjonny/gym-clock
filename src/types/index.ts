export type TimerMode =
  | "clock"
  | "stopwatch"
  | "countdown"
  | "tabata"
  | "emom"
  | "amrap";

export interface TabataSettings {
  workTime: number; // seconds
  restTime: number; // seconds
  rounds: number;
}

export interface EmomSettings {
  intervalTime: number; // seconds per minute (usually 60)
  totalMinutes: number;
}

export interface AmrapSettings {
  totalTime: number; // seconds
}

export interface CountdownSettings {
  totalTime: number; // seconds
}

export interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  currentTime: number; // milliseconds
  countdown: CountdownSettings;
  tabata: TabataSettings;
  emom: EmomSettings;
  amrap: AmrapSettings;
  // Tabata specific state
  currentRound: number;
  isWorkPhase: boolean;
  // EMOM specific state
  currentMinute: number;
  // Countdown intro (3-2-1 before workout starts)
  countdownIntro: number; // seconds (0 = disabled, typically 3, 5, or 10)
  isInCountdownIntro: boolean; // true while counting down intro
  introTimeRemaining: number; // milliseconds remaining in intro
}
