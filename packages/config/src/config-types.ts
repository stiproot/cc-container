/**
 * Common Configuration Types
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type Environment = 'development' | 'production' | 'test';

export interface BaseConfig {
  nodeEnv: Environment;
  logLevel: LogLevel;
  isProduction: boolean;
}
