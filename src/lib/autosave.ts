import { debounce } from './utils';

const DEBOUNCE_MS = 2_000;
const FORCE_INTERVAL_MS = 30_000;

export function createAutosave(saveFn: () => Promise<void>) {
  const debouncedSave = debounce(() => {
    void saveFn();
  }, DEBOUNCE_MS);

  const interval = setInterval(() => {
    void saveFn();
  }, FORCE_INTERVAL_MS);

  return {
    onChange: debouncedSave,
    destroy: () => {
      debouncedSave.cancel();
      clearInterval(interval);
    }
  };
}
