/**
 * Protocol Builder - Builds binary protocol frames for Vitruvian device communication
 * Ported from ProtocolBuilder.kt in the Android Kotlin codebase
 */

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Program modes that use command 0x04 (96-byte frame)
 */
export enum ProgramMode {
  OldSchool = 0,
  Pump = 2,
  TUT = 3,
  TUTBeast = 4,
  EccentricOnly = 6,
}

/**
 * Echo mode difficulty levels
 */
export enum EchoLevel {
  HARD = 0,
  HARDER = 1,
  HARDEST = 2,
  EPIC = 3,
}

/**
 * Eccentric load percentage for Echo mode
 * Machine hardware limit: 150% maximum
 */
export enum EccentricLoad {
  LOAD_0 = 0,
  LOAD_50 = 50,
  LOAD_75 = 75,
  LOAD_100 = 100,
  LOAD_125 = 125,
  LOAD_150 = 150,
}

/**
 * Workout type - either Program or Echo
 */
export type WorkoutType =
  | { type: 'program'; mode: ProgramMode }
  | { type: 'echo'; level: EchoLevel; eccentricLoad: EccentricLoad };

/**
 * Workout parameters
 */
export interface WorkoutParameters {
  workoutType: WorkoutType;
  reps: number;
  weightPerCableKg: number;
  progressionRegressionKg: number;
  isJustLift: boolean;
  useAutoStart: boolean;
  stopAtTop: boolean;
  warmupReps: number;
  selectedExerciseId?: string;
}

/**
 * Echo parameters data structure
 */
export interface EchoParams {
  eccentricPct: number;
  concentricPct: number;
  smoothing: number;
  floor: number;
  negLimit: number;
  gain: number;
  cap: number;
}

/**
 * RGB Color data structure
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Color scheme data structure
 */
export interface ColorScheme {
  name: string;
  brightness: number;
  colors: RGBColor[];
}

// =============================================================================
// Protocol Frame Builders
// =============================================================================

/**
 * Build the initial 4-byte command sent before INIT
 */
export function buildInitCommand(): Uint8Array {
  return new Uint8Array([0x0a, 0x00, 0x00, 0x00]);
}

/**
 * Build the INIT preset frame with coefficient table (34 bytes)
 */
export function buildInitPreset(): Uint8Array {
  return new Uint8Array([
    0x11, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0xcd, 0xcc, 0xcc, 0x3e, // 0.4 as float32 LE
    0xff, 0x00, 0x4c, 0xff,
    0x23, 0x8c, 0xff, 0x8c,
    0x8c, 0xff, 0x00, 0x4c,
    0xff, 0x23, 0x8c, 0xff,
    0x8c, 0x8c,
  ]);
}

/**
 * Build the 96-byte program parameters frame
 * CRITICAL: Working web app uses command 0x04 (verified from console logs)
 */
export function buildProgramParams(params: WorkoutParameters): Uint8Array {
  const frame = new Uint8Array(96);
  const view = new DataView(frame.buffer);

  // Header section - Command 0x04 for PROGRAM mode (verified from working web app)
  frame[0] = 0x04;
  frame[1] = 0x00;
  frame[2] = 0x00;
  frame[3] = 0x00;

  // Reps field at offset 0x04
  // For Just Lift, use 0xFF; for others, use reps+warmup+1
  // The +1 compensates for completeCounter incrementing at START of concentric (not end)
  // Without it, machine releases tension as you BEGIN the final rep
  frame[0x04] = params.isJustLift
    ? 0xff
    : params.reps + params.warmupReps + 1;

  // Some constant values from the working capture
  frame[5] = 0x03;
  frame[6] = 0x03;
  frame[7] = 0x00;

  // Float values at 0x08, 0x0c, 0x1c (appear to be constant 5.0)
  view.setFloat32(0x08, 5.0, true); // true = little endian
  view.setFloat32(0x0c, 5.0, true);
  view.setFloat32(0x1c, 5.0, true);

  // Fill in some other fields from the working capture
  frame[0x14] = 0xfa;
  frame[0x15] = 0x00;
  frame[0x16] = 0xfa;
  frame[0x17] = 0x00;
  frame[0x18] = 0xc8;
  frame[0x19] = 0x00;
  frame[0x1a] = 0x1e;
  frame[0x1b] = 0x00;

  // Repeat pattern
  frame[0x24] = 0xfa;
  frame[0x25] = 0x00;
  frame[0x26] = 0xfa;
  frame[0x27] = 0x00;
  frame[0x28] = 0xc8;
  frame[0x29] = 0x00;
  frame[0x2a] = 0x1e;
  frame[0x2b] = 0x00;

  frame[0x2c] = 0xfa;
  frame[0x2d] = 0x00;
  frame[0x2e] = 0x50;
  frame[0x2f] = 0x00;

  // Get the mode profile block (32 bytes for offsets 0x30-0x4F)
  // For Just Lift, use the base mode; otherwise use the mode directly
  let profileMode: ProgramMode;
  if (params.workoutType.type === 'program') {
    profileMode = params.isJustLift
      ? ProgramMode.OldSchool
      : params.workoutType.mode;
  } else {
    // Echo mode uses Old School as base profile
    profileMode = ProgramMode.OldSchool;
  }

  const profile = getModeProfile(profileMode);
  frame.set(profile, 0x30);

  // Calculate weights for protocol
  // FIRMWARE QUIRK: Machine applies progression starting from "rep 0" (before first rep)
  // To get correct behavior where first working rep has base weight,
  // we must subtract progression from base weight when sending to firmware
  const adjustedWeightPerCable =
    params.progressionRegressionKg !== 0
      ? params.weightPerCableKg - params.progressionRegressionKg
      : params.weightPerCableKg;

  const totalWeightKg = adjustedWeightPerCable;
  const effectiveKg = adjustedWeightPerCable + 10.0;

  // Debug logging (in React Native, you'd use console.log or a logging library)
  if (__DEV__) {
    console.log('=== WEIGHT DEBUG ===');
    console.log(`Per-cable weight (input): ${params.weightPerCableKg} kg`);
    console.log(`Progression: ${params.progressionRegressionKg} kg`);
    console.log(`Adjusted weight (compensated): ${adjustedWeightPerCable} kg`);
    console.log(`Total weight (sent to 0x58): ${totalWeightKg} kg`);
    console.log(`Effective weight (sent to 0x54): ${effectiveKg} kg`);
  }

  // Effective weight at offset 0x54
  view.setFloat32(0x54, effectiveKg, true);

  // Total weight at offset 0x58
  view.setFloat32(0x58, totalWeightKg, true);

  // Progression/Regression at offset 0x5C (kg per rep)
  view.setFloat32(0x5c, params.progressionRegressionKg, true);

  return frame;
}

/**
 * Build Echo mode control frame (32 bytes)
 */
export function buildEchoControl(
  level: EchoLevel,
  warmupReps: number = 3,
  targetReps: number = 2,
  isJustLift: boolean = false,
  eccentricPct: number = 75
): Uint8Array {
  const frame = new Uint8Array(32);
  const view = new DataView(frame.buffer);

  // Command ID at 0x00 (u32) = 0x4E (78 decimal)
  view.setUint32(0x00, 0x0000004e, true);

  // Warmup (0x04) and working reps (0x05)
  frame[0x04] = warmupReps;

  // For Just Lift Echo mode, use 0xFF; otherwise use targetReps+1
  // The +1 compensates for completeCounter incrementing at START of concentric (not end)
  // Without it, machine releases tension as you BEGIN the final rep
  frame[0x05] = isJustLift ? 0xff : targetReps + 1;

  // Reserved at 0x06-0x07 (u16 = 0)
  view.setUint16(0x06, 0, true);

  // Get Echo parameters for this level
  const echoParams = getEchoParams(level, eccentricPct);

  // Eccentric % at 0x08 (u16)
  view.setUint16(0x08, echoParams.eccentricPct, true);

  // Concentric % at 0x0A (u16)
  view.setUint16(0x0a, echoParams.concentricPct, true);

  // Smoothing at 0x0C (f32)
  view.setFloat32(0x0c, echoParams.smoothing, true);

  // Gain at 0x10 (f32)
  view.setFloat32(0x10, echoParams.gain, true);

  // Cap at 0x14 (f32)
  view.setFloat32(0x14, echoParams.cap, true);

  // Floor at 0x18 (f32)
  view.setFloat32(0x18, echoParams.floor, true);

  // Neg limit at 0x1C (f32)
  view.setFloat32(0x1c, echoParams.negLimit, true);

  return frame;
}

/**
 * Build a 34-byte color scheme packet
 */
export function buildColorScheme(
  brightness: number,
  colors: RGBColor[]
): Uint8Array {
  if (colors.length !== 3) {
    throw new Error('Color scheme must have exactly 3 colors');
  }

  const frame = new Uint8Array(34);
  const view = new DataView(frame.buffer);

  // Command ID: 0x00000011
  view.setUint32(0, 0x00000011, true);

  // Reserved fields
  view.setUint32(4, 0, true);
  view.setUint32(8, 0, true);

  // Brightness (float32)
  view.setFloat32(12, brightness, true);

  // Colors: 6 RGB triplets (3 colors repeated twice for left/right mirroring)
  let offset = 16;
  for (let i = 0; i < 2; i++) {
    // Repeat twice
    for (const color of colors) {
      frame[offset++] = color.r & 0xff;
      frame[offset++] = color.g & 0xff;
      frame[offset++] = color.b & 0xff;
    }
  }

  return frame;
}

/**
 * Build the START command (4 bytes)
 */
export function buildStartCommand(): Uint8Array {
  return new Uint8Array([0x03, 0x00, 0x00, 0x00]);
}

/**
 * Build the STOP command (4 bytes)
 */
export function buildStopCommand(): Uint8Array {
  return new Uint8Array([0x05, 0x00, 0x00, 0x00]);
}

/**
 * Build a color scheme command using predefined schemes
 */
export function buildColorSchemeCommand(schemeIndex: number): Uint8Array {
  const scheme = ColorSchemes.ALL[schemeIndex] || ColorSchemes.ALL[0];
  return buildColorScheme(scheme.brightness, scheme.colors);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get mode profile block for program modes (32 bytes)
 */
function getModeProfile(mode: ProgramMode): Uint8Array {
  const buffer = new Uint8Array(32);
  const view = new DataView(buffer.buffer);

  switch (mode) {
    case ProgramMode.OldSchool:
      view.setInt16(0x00, 0, true);
      view.setInt16(0x02, 20, true);
      view.setFloat32(0x04, 3.0, true);
      view.setInt16(0x08, 75, true);
      view.setInt16(0x0a, 600, true);
      view.setFloat32(0x0c, 50.0, true);
      view.setInt16(0x10, -1300, true);
      view.setInt16(0x12, -1200, true);
      view.setFloat32(0x14, 100.0, true);
      view.setInt16(0x18, -260, true);
      view.setInt16(0x1a, -110, true);
      view.setFloat32(0x1c, 0.0, true);
      break;

    case ProgramMode.Pump:
      view.setInt16(0x00, 50, true);
      view.setInt16(0x02, 450, true);
      view.setFloat32(0x04, 10.0, true);
      view.setInt16(0x08, 500, true);
      view.setInt16(0x0a, 600, true);
      view.setFloat32(0x0c, 50.0, true);
      view.setInt16(0x10, -700, true);
      view.setInt16(0x12, -550, true);
      view.setFloat32(0x14, 1.0, true);
      view.setInt16(0x18, -100, true);
      view.setInt16(0x1a, -50, true);
      view.setFloat32(0x1c, 1.0, true);
      break;

    case ProgramMode.TUT:
      view.setInt16(0x00, 250, true);
      view.setInt16(0x02, 350, true);
      view.setFloat32(0x04, 7.0, true);
      view.setInt16(0x08, 450, true);
      view.setInt16(0x0a, 600, true);
      view.setFloat32(0x0c, 50.0, true);
      view.setInt16(0x10, -900, true);
      view.setInt16(0x12, -700, true);
      view.setFloat32(0x14, 70.0, true);
      view.setInt16(0x18, -100, true);
      view.setInt16(0x1a, -50, true);
      view.setFloat32(0x1c, 14.0, true);
      break;

    case ProgramMode.TUTBeast:
      view.setInt16(0x00, 150, true);
      view.setInt16(0x02, 250, true);
      view.setFloat32(0x04, 7.0, true);
      view.setInt16(0x08, 350, true);
      view.setInt16(0x0a, 450, true);
      view.setFloat32(0x0c, 50.0, true);
      view.setInt16(0x10, -900, true);
      view.setInt16(0x12, -700, true);
      view.setFloat32(0x14, 70.0, true);
      view.setInt16(0x18, -100, true);
      view.setInt16(0x1a, -50, true);
      view.setFloat32(0x1c, 28.0, true);
      break;

    case ProgramMode.EccentricOnly:
      view.setInt16(0x00, 50, true);
      view.setInt16(0x02, 550, true);
      view.setFloat32(0x04, 50.0, true);
      view.setInt16(0x08, 650, true);
      view.setInt16(0x0a, 750, true);
      view.setFloat32(0x0c, 10.0, true);
      view.setInt16(0x10, -900, true);
      view.setInt16(0x12, -700, true);
      view.setFloat32(0x14, 70.0, true);
      view.setInt16(0x18, -100, true);
      view.setInt16(0x1a, -50, true);
      view.setFloat32(0x1c, 20.0, true);
      break;
  }

  return buffer;
}

/**
 * Get Echo parameters for a given level
 */
function getEchoParams(level: EchoLevel, eccentricPct: number): EchoParams {
  const baseParams: EchoParams = {
    eccentricPct,
    concentricPct: 50, // constant
    smoothing: 0.1,
    floor: 0.0,
    negLimit: -100.0,
    gain: 1.0,
    cap: 50.0,
  };

  switch (level) {
    case EchoLevel.HARD:
      return { ...baseParams, gain: 1.0, cap: 50.0 };
    case EchoLevel.HARDER:
      return { ...baseParams, gain: 1.25, cap: 40.0 };
    case EchoLevel.HARDEST:
      return { ...baseParams, gain: 1.667, cap: 30.0 };
    case EchoLevel.EPIC:
      return { ...baseParams, gain: 3.333, cap: 15.0 };
    default:
      return baseParams;
  }
}

// =============================================================================
// Predefined Color Schemes
// =============================================================================

export const ColorSchemes = {
  BLUE: {
    name: 'Blue',
    brightness: 0.4,
    colors: [
      { r: 0x00, g: 0xa8, b: 0xdd },
      { r: 0x00, g: 0xcf, b: 0xfc },
      { r: 0x5d, g: 0xdf, b: 0xfc },
    ],
  } as ColorScheme,

  GREEN: {
    name: 'Green',
    brightness: 0.4,
    colors: [
      { r: 0x7d, g: 0xc1, b: 0x47 },
      { r: 0xa1, g: 0xd8, b: 0x6a },
      { r: 0xba, g: 0xe0, b: 0x94 },
    ],
  } as ColorScheme,

  TEAL: {
    name: 'Teal',
    brightness: 0.4,
    colors: [
      { r: 0x3e, g: 0x9a, b: 0xb7 },
      { r: 0x83, g: 0xbe, b: 0xd1 },
      { r: 0xc2, g: 0xdf, b: 0xe8 },
    ],
  } as ColorScheme,

  YELLOW: {
    name: 'Yellow',
    brightness: 0.4,
    colors: [
      { r: 0xff, g: 0x90, b: 0x51 },
      { r: 0xff, g: 0xd6, b: 0x47 },
      { r: 0xff, g: 0xb7, b: 0x00 },
    ],
  } as ColorScheme,

  PINK: {
    name: 'Pink',
    brightness: 0.4,
    colors: [
      { r: 0xff, g: 0x00, b: 0x4c },
      { r: 0xff, g: 0x23, b: 0x8c },
      { r: 0xff, g: 0x8c, b: 0x8c },
    ],
  } as ColorScheme,

  RED: {
    name: 'Red',
    brightness: 0.4,
    colors: [
      { r: 0xff, g: 0x00, b: 0x00 },
      { r: 0xff, g: 0x55, b: 0x55 },
      { r: 0xff, g: 0xaa, b: 0xaa },
    ],
  } as ColorScheme,

  PURPLE: {
    name: 'Purple',
    brightness: 0.4,
    colors: [
      { r: 0x88, g: 0x00, b: 0xff },
      { r: 0xaa, g: 0x55, b: 0xff },
      { r: 0xdd, g: 0xaa, b: 0xff },
    ],
  } as ColorScheme,

  get ALL() {
    return [
      this.BLUE,
      this.GREEN,
      this.TEAL,
      this.YELLOW,
      this.PINK,
      this.RED,
      this.PURPLE,
    ];
  },
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validate RGB color values
 */
export function validateRGBColor(color: RGBColor): boolean {
  return (
    color.r >= 0 &&
    color.r <= 255 &&
    color.g >= 0 &&
    color.g <= 255 &&
    color.b >= 0 &&
    color.b <= 255
  );
}

/**
 * Convert Uint8Array to hex string for debugging
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(bytes.map(byte => parseInt(byte, 16)));
}
