/**
 * Centralised, typed access to environment configuration.
 * Every value has a sensible local-dev default so the app runs with zero setup.
 */
export const env = {
  port: Number(process.env.PORT) || 4000,
  /** Allowed browser origin for CORS + Socket.IO. */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;
