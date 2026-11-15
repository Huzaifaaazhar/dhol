import type { Director } from './common';
import { rich } from './rich';
import { jai } from './jai';
import { zikomo } from './zikomo';
import { dhol } from './dhol';
import { chaos } from './chaos';

/** One director per live mission; missions without one are pure dialogue/objective chains. */
export const DIRECTORS: Record<string, Director> = { rich, jai, zikomo, dhol, chaos };
