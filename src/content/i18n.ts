// Language selection point. English is the default pack; a French pack exists
// in strings.fr.ts / explanations.fr.ts and can be wired here later (e.g. from
// a ?lang= query or a header toggle).

export { STR } from './strings.en';
export { EXPLANATIONS_EN as EXPLANATIONS } from './explanations.en';
export type { Explanation, VizKind } from './types';
