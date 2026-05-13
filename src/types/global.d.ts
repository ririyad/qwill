import type { QwillApi } from './qwill';

declare global {
  interface Window {
    qwill: QwillApi;
  }
}

export {};
