import { RepCount, RepEvent, RepType } from '../models/Models';

/**
 * Snapshot of the discovered rep ranges for UI/diagnostics.
 */
export interface RepRanges {
  minPosA: number | null;
  maxPosA: number | null;
  minPosB: number | null;
  maxPosB: number | null;
  minRangeA: [number, number] | null;
  maxRangeA: [number, number] | null;
  minRangeB: [number, number] | null;
  maxRangeB: [number, number] | null;
  rangeA: number | null;
  rangeB: number | null;
}

/**
 * Handles rep counting based on notifications emitted by the Vitruvian machine.
 *
 * This is a direct port of the logic used by the reference web application. Rather than trying to
 * infer reps from position data, we track the counters supplied by the hardware (u16 values) and
 * supplement them with light position tracking for range calibration and auto-stop support.
 */
export class RepCounterFromMachine {
  private warmupReps: number = 0;
  private workingReps: number = 0;
  private warmupTarget: number = 3;
  private workingTarget: number = 0;
  private isJustLift: boolean = false;
  private stopAtTop: boolean = false;
  private shouldStop: boolean = false;

  private lastTopCounter: number | null = null;
  private lastCompleteCounter: number | null = null;

  private topPositionsA: number[] = [];
  private topPositionsB: number[] = [];
  private bottomPositionsA: number[] = [];
  private bottomPositionsB: number[] = [];

  private maxRepPosA: number | null = null;
  private minRepPosA: number | null = null;
  private maxRepPosB: number | null = null;
  private minRepPosB: number | null = null;

  private maxRepPosARange: [number, number] | null = null;
  private minRepPosARange: [number, number] | null = null;
  private maxRepPosBRange: [number, number] | null = null;
  private minRepPosBRange: [number, number] | null = null;

  public onRepEvent: ((event: RepEvent) => void) | null = null;

  /**
   * Configure the rep counter with workout parameters
   */
  public configure(
    warmupTarget: number,
    workingTarget: number,
    isJustLift: boolean,
    stopAtTop: boolean
  ): void {
    this.warmupTarget = warmupTarget;
    this.workingTarget = workingTarget;
    this.isJustLift = isJustLift;
    this.stopAtTop = stopAtTop;
  }

  /**
   * Reset the rep counter to initial state
   */
  public reset(): void {
    this.warmupReps = 0;
    this.workingReps = 0;
    this.shouldStop = false;
    this.lastTopCounter = null;
    this.lastCompleteCounter = null;
    this.topPositionsA = [];
    this.topPositionsB = [];
    this.bottomPositionsA = [];
    this.bottomPositionsB = [];
    this.maxRepPosA = null;
    this.minRepPosA = null;
    this.maxRepPosB = null;
    this.minRepPosB = null;
    this.maxRepPosARange = null;
    this.minRepPosARange = null;
    this.maxRepPosBRange = null;
    this.minRepPosBRange = null;
  }

  /**
   * Process a new counter update from the machine
   */
  public process(topCounter: number, completeCounter: number, posA: number = 0, posB: number = 0): void {
    // Handle top counter
    if (this.lastTopCounter !== null) {
      const topDelta = this.calculateDelta(this.lastTopCounter, topCounter);
      if (topDelta > 0) {
        this.recordTopPosition(posA, posB);

        // SAFETY FIX: Stop at top position AFTER completing target reps
        // This ensures full tension through both concentric and eccentric of final rep
        // Changed from (workingTarget - 1) to (workingTarget) so we don't release early
        if (
          this.stopAtTop &&
          !this.isJustLift &&
          this.workingTarget > 0 &&
          this.workingReps >= this.workingTarget
        ) {
          this.shouldStop = true;
          this.onRepEvent?.({
            type: RepType.WORKOUT_COMPLETE,
            warmupCount: this.warmupReps,
            workingCount: this.workingReps,
            timestamp: Date.now(),
          });
        }
      }
    }
    this.lastTopCounter = topCounter;

    // Handle complete counter
    if (this.lastCompleteCounter === null) {
      this.lastCompleteCounter = completeCounter;
      return; // Skip first signal to establish baseline
    }

    const delta = this.calculateDelta(this.lastCompleteCounter, completeCounter);
    if (delta <= 0) {
      return;
    }

    this.lastCompleteCounter = completeCounter;

    this.recordBottomPosition(posA, posB);

    const totalReps = this.warmupReps + this.workingReps + 1;
    if (totalReps <= this.warmupTarget) {
      // Warmup rep
      this.warmupReps++;
      this.onRepEvent?.({
        type: RepType.WARMUP_COMPLETED,
        warmupCount: this.warmupReps,
        workingCount: this.workingReps,
        timestamp: Date.now(),
      });

      if (this.warmupReps === this.warmupTarget) {
        this.onRepEvent?.({
          type: RepType.WARMUP_COMPLETE,
          warmupCount: this.warmupReps,
          workingCount: this.workingReps,
          timestamp: Date.now(),
        });
      }
    } else {
      // Working rep
      this.workingReps++;
      this.onRepEvent?.({
        type: RepType.WORKING_COMPLETED,
        warmupCount: this.warmupReps,
        workingCount: this.workingReps,
        timestamp: Date.now(),
      });

      // Only stop at bottom if stopAtTop is disabled
      // Most users should use stopAtTop (safer) but this preserves old behavior for those who want it
      if (
        !this.stopAtTop &&
        !this.isJustLift &&
        this.workingTarget > 0 &&
        this.workingReps >= this.workingTarget
      ) {
        this.shouldStop = true;
        this.onRepEvent?.({
          type: RepType.WORKOUT_COMPLETE,
          warmupCount: this.warmupReps,
          workingCount: this.workingReps,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Calculate delta between two u16 counter values, handling overflow
   */
  private calculateDelta(last: number, current: number): number {
    if (current >= last) {
      return current - last;
    } else {
      // Handle u16 overflow
      return 0xffff - last + current + 1;
    }
  }

  /**
   * Record a top position measurement
   */
  private recordTopPosition(posA: number, posB: number): void {
    if (posA <= 0 && posB <= 0) return;

    const window = this.getWindowSize();
    if (posA > 0) {
      this.topPositionsA.push(posA);
      if (this.topPositionsA.length > window) {
        this.topPositionsA.shift();
      }
    }
    if (posB > 0) {
      this.topPositionsB.push(posB);
      if (this.topPositionsB.length > window) {
        this.topPositionsB.shift();
      }
    }

    this.updateRepRanges();
  }

  /**
   * Record a bottom position measurement
   */
  private recordBottomPosition(posA: number, posB: number): void {
    if (posA <= 0 && posB <= 0) return;

    const window = this.getWindowSize();
    if (posA > 0) {
      this.bottomPositionsA.push(posA);
      if (this.bottomPositionsA.length > window) {
        this.bottomPositionsA.shift();
      }
    }
    if (posB > 0) {
      this.bottomPositionsB.push(posB);
      if (this.bottomPositionsB.length > window) {
        this.bottomPositionsB.shift();
      }
    }

    this.updateRepRanges();
  }

  /**
   * Update the computed rep ranges from position samples
   */
  private updateRepRanges(): void {
    if (this.topPositionsA.length > 0) {
      this.maxRepPosA = Math.round(
        this.topPositionsA.reduce((sum, val) => sum + val, 0) / this.topPositionsA.length
      );
      this.maxRepPosARange = [Math.min(...this.topPositionsA), Math.max(...this.topPositionsA)];
    }
    if (this.bottomPositionsA.length > 0) {
      this.minRepPosA = Math.round(
        this.bottomPositionsA.reduce((sum, val) => sum + val, 0) / this.bottomPositionsA.length
      );
      this.minRepPosARange = [Math.min(...this.bottomPositionsA), Math.max(...this.bottomPositionsA)];
    }
    if (this.topPositionsB.length > 0) {
      this.maxRepPosB = Math.round(
        this.topPositionsB.reduce((sum, val) => sum + val, 0) / this.topPositionsB.length
      );
      this.maxRepPosBRange = [Math.min(...this.topPositionsB), Math.max(...this.topPositionsB)];
    }
    if (this.bottomPositionsB.length > 0) {
      this.minRepPosB = Math.round(
        this.bottomPositionsB.reduce((sum, val) => sum + val, 0) / this.bottomPositionsB.length
      );
      this.minRepPosBRange = [Math.min(...this.bottomPositionsB), Math.max(...this.bottomPositionsB)];
    }
  }

  /**
   * Get the sliding window size for position averaging
   */
  private getWindowSize(): number {
    const total = this.warmupReps + this.workingReps;
    return total < this.warmupTarget ? 2 : 3;
  }

  /**
   * Get the current rep count
   */
  public getRepCount(): RepCount {
    const total = this.workingReps; // Exclude warm-up reps from total count
    return {
      warmupReps: this.warmupReps,
      workingReps: this.workingReps,
      totalReps: total,
      isWarmupComplete: this.warmupReps >= this.warmupTarget,
    };
  }

  /**
   * Check if the workout should stop
   */
  public shouldStopWorkout(): boolean {
    return this.shouldStop;
  }

  /**
   * Get the calibrated top position
   */
  public getCalibratedTopPosition(): number | null {
    return this.maxRepPosA;
  }

  /**
   * Get the current rep ranges
   */
  public getRepRanges(): RepRanges {
    const rangeA =
      this.minRepPosA !== null && this.maxRepPosA !== null
        ? Math.max(this.maxRepPosA - this.minRepPosA, 0)
        : null;
    const rangeB =
      this.minRepPosB !== null && this.maxRepPosB !== null
        ? Math.max(this.maxRepPosB - this.minRepPosB, 0)
        : null;

    return {
      minPosA: this.minRepPosA,
      maxPosA: this.maxRepPosA,
      minPosB: this.minRepPosB,
      maxPosB: this.maxRepPosB,
      minRangeA: this.minRepPosARange,
      maxRangeA: this.maxRepPosARange,
      minRangeB: this.minRepPosBRange,
      maxRangeB: this.maxRepPosBRange,
      rangeA,
      rangeB,
    };
  }

  /**
   * Check if we have a meaningful range of motion
   */
  public hasMeaningfulRange(minRangeThreshold: number = 50): boolean {
    const rangeA =
      this.minRepPosA !== null && this.maxRepPosA !== null ? this.maxRepPosA - this.minRepPosA : 0;
    const rangeB =
      this.minRepPosB !== null && this.maxRepPosB !== null ? this.maxRepPosB - this.minRepPosB : 0;
    return rangeA > minRangeThreshold || rangeB > minRangeThreshold;
  }

  /**
   * Check if current position is in the danger zone (near bottom)
   */
  public isInDangerZone(posA: number, posB: number, minRangeThreshold: number = 50): boolean {
    const checkA = this.minRepPosA !== null && this.maxRepPosA !== null;
    const checkB = this.minRepPosB !== null && this.maxRepPosB !== null;
    if (!checkA && !checkB) return false;

    let danger = false;
    if (checkA) {
      const rangeA = this.maxRepPosA! - this.minRepPosA!;
      if (rangeA > minRangeThreshold) {
        const thresholdA = this.minRepPosA! + Math.floor(rangeA * 0.05);
        danger = danger || posA <= thresholdA;
      }
    }
    if (checkB) {
      const rangeB = this.maxRepPosB! - this.minRepPosB!;
      if (rangeB > minRangeThreshold) {
        const thresholdB = this.minRepPosB! + Math.floor(rangeB * 0.05);
        danger = danger || posB <= thresholdB;
      }
    }
    return danger;
  }
}
