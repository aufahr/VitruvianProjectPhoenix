/**
 * Custom hook for haptic feedback
 * Replaces haptic event handling from MainViewModel
 */

import { useEffect, useCallback } from 'react';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
  HapticOptions,
} from 'react-native-haptic-feedback';
import { HapticEvent } from '../../domain/models/Models';

// Haptic feedback options
const hapticOptions: HapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Haptic pattern configurations for different events
 */
const HAPTIC_PATTERNS: Record<HapticEvent, HapticFeedbackTypes> = {
  [HapticEvent.REP_COMPLETED]: 'impactLight',
  [HapticEvent.WARMUP_COMPLETE]: 'impactMedium',
  [HapticEvent.WORKOUT_COMPLETE]: 'notificationSuccess',
  [HapticEvent.WORKOUT_START]: 'impactMedium',
  [HapticEvent.WORKOUT_END]: 'impactMedium',
  [HapticEvent.ERROR]: 'notificationError',
};

/**
 * Custom hook for haptic feedback management
 */
export const useHapticFeedback = () => {
  // Trigger haptic feedback for a specific event
  const trigger = useCallback((event: HapticEvent) => {
    const pattern = HAPTIC_PATTERNS[event];

    if (!pattern) {
      console.warn(`No haptic pattern defined for event: ${event}`);
      return;
    }

    console.log(`Triggering haptic: ${event} (${pattern})`);

    ReactNativeHapticFeedback.trigger(pattern, hapticOptions);
  }, []);

  // Trigger custom haptic pattern
  const triggerCustom = useCallback((type: HapticFeedbackTypes) => {
    ReactNativeHapticFeedback.trigger(type, hapticOptions);
  }, []);

  // Trigger light impact (rep completed)
  const triggerLight = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }, []);

  // Trigger medium impact (warmup complete, workout start/end)
  const triggerMedium = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }, []);

  // Trigger heavy impact
  const triggerHeavy = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  }, []);

  // Trigger success notification (workout complete, new PR)
  const triggerSuccess = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  }, []);

  // Trigger warning notification
  const triggerWarning = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
  }, []);

  // Trigger error notification (connection lost, workout error)
  const triggerError = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  }, []);

  // Trigger selection (button tap, selection change)
  const triggerSelection = useCallback(() => {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
  }, []);

  return {
    // Main trigger function
    trigger,

    // Custom pattern trigger
    triggerCustom,

    // Convenience methods
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerSuccess,
    triggerWarning,
    triggerError,
    triggerSelection,
  };
};

/**
 * Hook to automatically trigger haptic feedback when an event is emitted
 */
export const useHapticEventListener = (
  eventSource: { on: (event: string, handler: (data: any) => void) => void; off: (event: string, handler: any) => void },
  eventName: string = 'hapticEvent'
) => {
  const { trigger } = useHapticFeedback();

  useEffect(() => {
    const handleHapticEvent = (event: HapticEvent) => {
      trigger(event);
    };

    eventSource.on(eventName, handleHapticEvent);

    return () => {
      eventSource.off(eventName, handleHapticEvent);
    };
  }, [eventSource, eventName, trigger]);
};

/**
 * Common haptic feedback sequences for complex interactions
 */
export const useHapticSequences = () => {
  const { trigger } = useHapticFeedback();

  // Rep progression: light tap for each rep
  const repSequence = useCallback(
    async (repNumber: number) => {
      for (let i = 0; i < repNumber; i++) {
        trigger(HapticEvent.REP_COMPLETED);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    },
    [trigger]
  );

  // Countdown sequence: medium taps for 3-2-1
  const countdownSequence = useCallback(async () => {
    for (let i = 3; i > 0; i--) {
      trigger(HapticEvent.WORKOUT_START);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, [trigger]);

  // Success celebration: multiple success haptics
  const celebrationSequence = useCallback(async () => {
    trigger(HapticEvent.WORKOUT_COMPLETE);
    await new Promise((resolve) => setTimeout(resolve, 200));
    trigger(HapticEvent.WORKOUT_COMPLETE);
    await new Promise((resolve) => setTimeout(resolve, 200));
    trigger(HapticEvent.WORKOUT_COMPLETE);
  }, [trigger]);

  return {
    repSequence,
    countdownSequence,
    celebrationSequence,
  };
};
