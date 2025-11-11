/**
 * Color Schemes - Re-export from protocolBuilder for convenience
 * Migrated from Android Kotlin ColorSchemes object
 */

export type { ColorScheme, RGBColor } from './protocolBuilder';
export { ColorSchemes } from './protocolBuilder';

// Re-export the ALL array as COLOR_SCHEMES for easier access
import { ColorSchemes } from './protocolBuilder';

export const COLOR_SCHEMES = ColorSchemes.ALL;
