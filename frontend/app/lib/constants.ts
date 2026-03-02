/**
 * Application constants and configuration values
 */

export const APP_NAME = 'Judge Agent';
export const APP_VERSION = '0.0.1';
export const CURRENT_YEAR = new Date().getFullYear();

/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_TIMEOUT_MS = 30000;
export const API_RETRY_COUNT = 3;

/**
 * Feature flags (can be overridden via environment variables)
 */
export const FEATURES = {
  enableAnalytics: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  enableDebugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
};

/**
 * UI Constants
 */
export const ITEMS_PER_PAGE = 20;
export const TOAST_DURATION_MS = 3000;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  health: '/health',
  root: '/',
  judge: '/judge',
} as const;
