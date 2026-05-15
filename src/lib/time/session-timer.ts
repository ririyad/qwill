import { derived, writable } from 'svelte/store';

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;

export const sessionSeconds = writable(0);
export const isSessionTimerActive = writable(false);

let timer: ReturnType<typeof setInterval> | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let hasStarted = false;

export const formattedSessionTime = derived(sessionSeconds, ($sessionSeconds) => {
  const hours = Math.floor($sessionSeconds / 3600);
  const minutes = Math.floor(($sessionSeconds % 3600) / 60);
  const seconds = $sessionSeconds % 60;

  return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
});

export function recordWritingActivity(): void {
  if (!hasStarted) {
    hasStarted = true;
  }

  startTimer();
  resetInactivityTimer();
}

export function destroySessionTimer(): void {
  stopTimer();

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function startTimer(): void {
  if (timer) return;

  isSessionTimerActive.set(true);
  timer = setInterval(() => {
    sessionSeconds.update((seconds) => seconds + 1);
  }, 1_000);
}

function stopTimer(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  isSessionTimerActive.set(false);
}

function resetInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  inactivityTimer = setTimeout(() => {
    stopTimer();
  }, INACTIVITY_LIMIT_MS);
}
