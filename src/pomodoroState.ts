export type Timer = {
  mode: 'focus' | 'rest';
  focus: number;
  rest: number;
  duration: number;
  remaining: number;
  endsAt: number | null;
};

export const initialTimer: Timer = {
  mode: 'focus', focus: 25, rest: 5, duration: 1500000, remaining: 1500000, endsAt: null,
};

export function restoreTimer(value: string | null): Timer {
  if (value === null) return initialTimer;
  const timer: unknown = JSON.parse(value);
  if (!timer || typeof timer !== 'object') throw new Error('Sessão inválida.');
  const state = timer as Timer;
  if ((state.mode !== 'focus' && state.mode !== 'rest')
    || !Number.isInteger(state.focus) || state.focus < 1 || state.focus > 120
    || !Number.isInteger(state.rest) || state.rest < 1 || state.rest > 60
    || !Number.isInteger(state.duration) || state.duration < 60000 || state.duration > 7200000
    || !Number.isFinite(state.remaining) || state.remaining < 0 || state.remaining > state.duration
    || (state.endsAt !== null && (!Number.isSafeInteger(state.endsAt) || state.endsAt <= 0))) {
    throw new Error('Sessão inválida.');
  }
  return state;
}
