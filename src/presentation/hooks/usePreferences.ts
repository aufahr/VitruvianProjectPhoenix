/**
 * Custom hook for user preferences management
 * Wraps PreferencesManager with React state management
 */

import { useState, useEffect, useCallback } from 'react';
import { getPreferencesManager } from '../../data/repository';
import { UserPreferences } from '../../domain/models/UserPreferences';
import { WeightUnit } from '../../domain/models/Models';

export const usePreferences = () => {
  const preferencesManager = getPreferencesManager();
  const [preferences, setPreferences] = useState<UserPreferences>({
    weightUnit: WeightUnit.KG,
    autoplayEnabled: true,
    stopAtTop: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const prefs = await preferencesManager.getPreferences();
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [preferencesManager]);

  // Listen for preference changes
  useEffect(() => {
    const handlePreferencesChange = (updatedPrefs: UserPreferences) => {
      setPreferences(updatedPrefs);
    };

    preferencesManager.on('preferencesChange', handlePreferencesChange);

    return () => {
      preferencesManager.off('preferencesChange', handlePreferencesChange);
    };
  }, [preferencesManager]);

  // Set weight unit
  const setWeightUnit = useCallback(
    async (unit: WeightUnit) => {
      try {
        await preferencesManager.setWeightUnit(unit);
      } catch (error) {
        console.error('Failed to set weight unit:', error);
      }
    },
    [preferencesManager]
  );

  // Set autoplay enabled
  const setAutoplayEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await preferencesManager.setAutoplayEnabled(enabled);
      } catch (error) {
        console.error('Failed to set autoplay enabled:', error);
      }
    },
    [preferencesManager]
  );

  // Set stop at top
  const setStopAtTop = useCallback(
    async (enabled: boolean) => {
      try {
        await preferencesManager.setStopAtTop(enabled);
      } catch (error) {
        console.error('Failed to set stop at top:', error);
      }
    },
    [preferencesManager]
  );

  // Clear all preferences
  const clearPreferences = useCallback(async () => {
    try {
      await preferencesManager.clearPreferences();
    } catch (error) {
      console.error('Failed to clear preferences:', error);
    }
  }, [preferencesManager]);

  return {
    preferences,
    isLoading,
    setWeightUnit,
    setAutoplayEnabled,
    setStopAtTop,
    clearPreferences,
  };
};
