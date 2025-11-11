import { WeightUnit } from './Models';

/**
 * User preferences data
 */
export interface UserPreferences {
  weightUnit?: WeightUnit;
  autoplayEnabled?: boolean;
  stopAtTop?: boolean; // false = stop at bottom (extended), true = stop at top (contracted)
}

/**
 * Create default user preferences
 */
export const createDefaultUserPreferences = (): UserPreferences => ({
  weightUnit: WeightUnit.KG,
  autoplayEnabled: true,
  stopAtTop: false,
});
