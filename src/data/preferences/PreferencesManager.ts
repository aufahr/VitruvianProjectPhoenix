/**
 * Preferences Manager - Manages user preferences
 * Migrated from Android Kotlin PreferencesManager (DataStore) to React Native TypeScript (AsyncStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';
import { UserPreferences, createDefaultUserPreferences } from '../../domain/models/UserPreferences';
import { WeightUnit } from '../../domain/models/Models';

// AsyncStorage keys
const STORAGE_KEYS = {
  WEIGHT_UNIT: '@vitruvian:weight_unit',
  AUTOPLAY_ENABLED: '@vitruvian:autoplay_enabled',
  STOP_AT_TOP: '@vitruvian:stop_at_top',
} as const;

/**
 * Preferences Manager interface
 */
export interface IPreferencesManager {
  // Observers via EventEmitter
  on(event: 'preferencesChange', listener: (preferences: UserPreferences) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;

  // Get preferences
  getPreferences(): Promise<UserPreferences>;

  // Set individual preferences
  setWeightUnit(unit: WeightUnit): Promise<void>;
  setAutoplayEnabled(enabled: boolean): Promise<void>;
  setStopAtTop(enabled: boolean): Promise<void>;

  // Bulk update
  updatePreferences(preferences: Partial<UserPreferences>): Promise<void>;

  // Clear all preferences
  clearPreferences(): Promise<void>;
}

/**
 * Preferences Manager implementation using AsyncStorage
 */
class PreferencesManagerImpl extends EventEmitter implements IPreferencesManager {
  private cachedPreferences: UserPreferences | null = null;

  constructor() {
    super();
  }

  /**
   * Get all preferences
   * Returns cached preferences if available, otherwise loads from AsyncStorage
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      // Return cached if available
      if (this.cachedPreferences) {
        return this.cachedPreferences;
      }

      // Load from AsyncStorage
      const [weightUnitStr, autoplayStr, stopAtTopStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_UNIT),
        AsyncStorage.getItem(STORAGE_KEYS.AUTOPLAY_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.STOP_AT_TOP),
      ]);

      // Parse and validate
      let weightUnit = WeightUnit.KG;
      if (weightUnitStr) {
        try {
          weightUnit = weightUnitStr as WeightUnit;
          if (weightUnit !== WeightUnit.KG && weightUnit !== WeightUnit.LB) {
            console.warn(`[PreferencesManager] Invalid weight unit: ${weightUnitStr}, defaulting to KG`);
            weightUnit = WeightUnit.KG;
          }
        } catch (error) {
          console.warn(`[PreferencesManager] Failed to parse weight unit: ${weightUnitStr}, defaulting to KG`);
          weightUnit = WeightUnit.KG;
        }
      }

      const autoplayEnabled = autoplayStr !== null ? autoplayStr === 'true' : true;
      const stopAtTop = stopAtTopStr !== null ? stopAtTopStr === 'true' : false;

      this.cachedPreferences = {
        weightUnit,
        autoplayEnabled,
        stopAtTop,
      };

      return this.cachedPreferences;
    } catch (error) {
      console.error('[PreferencesManager] Failed to get preferences:', error);
      // Return defaults on error
      const defaults = createDefaultUserPreferences();
      this.cachedPreferences = defaults;
      return defaults;
    }
  }

  /**
   * Set the weight unit preference
   */
  async setWeightUnit(unit: WeightUnit): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_UNIT, unit);
      console.log(`[PreferencesManager] Weight unit preference set to: ${unit}`);

      // Update cache
      const prefs = await this.getPreferences();
      this.cachedPreferences = { ...prefs, weightUnit: unit };

      // Emit change event
      this.emit('preferencesChange', this.cachedPreferences);
    } catch (error) {
      console.error('[PreferencesManager] Failed to set weight unit:', error);
      throw error;
    }
  }

  /**
   * Set the autoplay enabled preference
   */
  async setAutoplayEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTOPLAY_ENABLED, enabled.toString());
      console.log(`[PreferencesManager] Autoplay enabled preference set to: ${enabled}`);

      // Update cache
      const prefs = await this.getPreferences();
      this.cachedPreferences = { ...prefs, autoplayEnabled: enabled };

      // Emit change event
      this.emit('preferencesChange', this.cachedPreferences);
    } catch (error) {
      console.error('[PreferencesManager] Failed to set autoplay enabled:', error);
      throw error;
    }
  }

  /**
   * Set the stop at top preference
   */
  async setStopAtTop(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STOP_AT_TOP, enabled.toString());
      console.log(`[PreferencesManager] Stop at top preference set to: ${enabled}`);

      // Update cache
      const prefs = await this.getPreferences();
      this.cachedPreferences = { ...prefs, stopAtTop: enabled };

      // Emit change event
      this.emit('preferencesChange', this.cachedPreferences);
    } catch (error) {
      console.error('[PreferencesManager] Failed to set stop at top:', error);
      throw error;
    }
  }

  /**
   * Update multiple preferences at once
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const updates: Promise<void>[] = [];

      if (preferences.weightUnit !== undefined) {
        updates.push(AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_UNIT, preferences.weightUnit));
      }

      if (preferences.autoplayEnabled !== undefined) {
        updates.push(AsyncStorage.setItem(STORAGE_KEYS.AUTOPLAY_ENABLED, preferences.autoplayEnabled.toString()));
      }

      if (preferences.stopAtTop !== undefined) {
        updates.push(AsyncStorage.setItem(STORAGE_KEYS.STOP_AT_TOP, preferences.stopAtTop.toString()));
      }

      await Promise.all(updates);
      console.log('[PreferencesManager] Preferences updated:', preferences);

      // Update cache
      const currentPrefs = await this.getPreferences();
      this.cachedPreferences = { ...currentPrefs, ...preferences };

      // Emit change event
      this.emit('preferencesChange', this.cachedPreferences);
    } catch (error) {
      console.error('[PreferencesManager] Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Clear all preferences (reset to defaults)
   */
  async clearPreferences(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.WEIGHT_UNIT),
        AsyncStorage.removeItem(STORAGE_KEYS.AUTOPLAY_ENABLED),
        AsyncStorage.removeItem(STORAGE_KEYS.STOP_AT_TOP),
      ]);

      console.log('[PreferencesManager] All preferences cleared');

      // Reset cache
      this.cachedPreferences = createDefaultUserPreferences();

      // Emit change event
      this.emit('preferencesChange', this.cachedPreferences);
    } catch (error) {
      console.error('[PreferencesManager] Failed to clear preferences:', error);
      throw error;
    }
  }
}

// Export singleton instance
let preferencesManagerInstance: PreferencesManagerImpl | null = null;

export const getPreferencesManager = (): IPreferencesManager => {
  if (!preferencesManagerInstance) {
    preferencesManagerInstance = new PreferencesManagerImpl();
  }
  return preferencesManagerInstance;
};

export const resetPreferencesManager = (): void => {
  preferencesManagerInstance = null;
};

// Export implementation
export { PreferencesManagerImpl };
