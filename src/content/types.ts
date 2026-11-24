// Shapes of the interface texts.

export type VizKind =
  | 'curve' // speed-time curve (rise / fall / brake)
  | 'rotor' // spinning rotor at real speed
  | 'crossover' // two-way diagram
  | 'character' // qualitative filter schematic
  | 'none';

export interface Explanation {
  /** Short name shown as the explainer title. */
  title: string;
  /** What the setting does, plain language. */
  what: string;
  /** What you hear when changing it. */
  hear: string;
  /** Optional tuning advice / interactions with other parameters. */
  advice?: string;
  viz: VizKind;
}
