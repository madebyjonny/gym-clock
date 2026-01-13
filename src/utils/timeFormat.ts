import { TimerState } from "../types";

export function formatTime(ms: number, showMillis: boolean = false): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);

  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  if (showMillis) {
    return `${timeStr}.${millis.toString().padStart(2, "0")}`;
  }

  return timeStr;
}

export function formatCountdown(state: TimerState): string {
  const remaining = Math.max(
    0,
    state.countdown.totalTime * 1000 - state.currentTime
  );
  return formatTime(remaining);
}

export function formatTabata(state: TimerState): {
  time: string;
  round: string;
  phase: string;
} {
  const { workTime, restTime } = state.tabata;
  const cycleTime = (workTime + restTime) * 1000;
  const currentCycleTime = state.currentTime % cycleTime;

  let phaseTime: number;
  if (state.isWorkPhase) {
    phaseTime = workTime * 1000 - currentCycleTime;
  } else {
    phaseTime = cycleTime - currentCycleTime;
  }

  return {
    time: formatTime(Math.max(0, phaseTime)),
    round: `${state.currentRound}/${state.tabata.rounds}`,
    phase: state.isWorkPhase ? "WORK" : "REST",
  };
}

export function formatEmom(state: TimerState): {
  time: string;
  minute: string;
} {
  const timeInCurrentMinute = state.currentTime % 60000;
  const remaining = 60000 - timeInCurrentMinute;

  return {
    time: formatTime(Math.max(0, remaining)),
    minute: `${state.currentMinute}/${state.emom.totalMinutes}`,
  };
}

export function formatAmrap(state: TimerState): string {
  const remaining = Math.max(
    0,
    state.amrap.totalTime * 1000 - state.currentTime
  );
  return formatTime(remaining);
}

export function formatStopwatch(state: TimerState): string {
  return formatTime(state.currentTime, true);
}

export function formatClock(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
