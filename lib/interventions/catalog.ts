import libraryData from '../../content/interventions/library.json' with { type: 'json' };
import localData from '../../content/interventions/local-data.json' with { type: 'json' };
import type { Library, LocalData } from './types.ts';
export const library = libraryData as Library;
export const local = localData as LocalData;
