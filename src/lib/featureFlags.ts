/**
 * Feature Flags Utility
 * Centralized feature flag management for Agent 10 - Critical UIs
 */

export const FEATURE_FLAGS = {
  commandCenter: process.env.NEXT_PUBLIC_FEATURE_COMMAND_CENTER === 'true',
  groundOps: process.env.NEXT_PUBLIC_FEATURE_GROUND_OPS === 'true',
  incidents: process.env.NEXT_PUBLIC_FEATURE_INCIDENTS === 'true',
  shifts: process.env.NEXT_PUBLIC_FEATURE_SHIFTS === 'true',
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return FEATURE_FLAGS[feature];
};

/**
 * Get all enabled features
 */
export const getEnabledFeatures = (): FeatureFlag[] => {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag);
};
