/**
 * Component Exports
 * Central export file for all reusable UI components
 * Migrated from Android Compose to React Native
 */

// Base Infrastructure Components
export {Card} from './Card';
export type {CardProps} from './Card';

export {Button, TextButton, OutlinedButton} from './Button';
export type {ButtonProps} from './Button';

export {Input, SearchInput} from './Input';
export type {InputProps} from './Input';

export {LoadingSpinner, LoadingOverlay} from './LoadingSpinner';
export type {LoadingSpinnerProps} from './LoadingSpinner';

export {Modal, AlertDialog} from './Modal';
export type {ModalProps} from './Modal';

export {ErrorBoundary} from './ErrorBoundary';

// Connection Components
export {ConnectionStatusBanner} from './ConnectionStatusBanner';
export type {ConnectionStatusBannerProps} from './ConnectionStatusBanner';

export {ConnectingOverlay} from './ConnectingOverlay';
export type {ConnectingOverlayProps} from './ConnectingOverlay';

export {ConnectionErrorDialog} from './ConnectionErrorDialog';
export type {ConnectionErrorDialogProps} from './ConnectionErrorDialog';

export {ConnectionLostDialog} from './ConnectionLostDialog';
export type {ConnectionLostDialogProps} from './ConnectionLostDialog';

// Empty State Component
export {EmptyState} from './EmptyState';
export type {EmptyStateProps} from './EmptyState';

// Timer Components
export {CountdownTimer} from './CountdownTimer';
export type {CountdownTimerProps} from './CountdownTimer';

export {RestTimer} from './RestTimer';
export type {RestTimerProps} from './RestTimer';

// Exercise and Routine Components
export {ExerciseCard} from './ExerciseCard';
export type {ExerciseCardProps} from './ExerciseCard';

export {RoutineCard} from './RoutineCard';
export type {RoutineCardProps, RoutineExercise} from './RoutineCard';

// Stats and Metrics Components
export {StatsCard} from './StatsCard';
export type {StatsCardProps} from './StatsCard';

export {WorkoutMetricsDisplay, createWorkoutSummaryMetrics} from './WorkoutMetricsDisplay';
export type {WorkoutMetricsDisplayProps, WorkoutMetric} from './WorkoutMetricsDisplay';
