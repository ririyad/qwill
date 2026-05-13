import { app } from 'electron';
import { join } from 'node:path';

export function getDraftsPath(): string {
  return join(app.getPath('userData'), 'drafts');
}
