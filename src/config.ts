import { getEnvVar, loadEnvironmentVariables } from "./utils/env";

// Load environment variables
loadEnvironmentVariables();

// Discord API Configuration
export const DISCORD_CLIENT_ID = getEnvVar('DISCORD_CLIENT_ID');
export const DISCORD_CLIENT_SECRET = getEnvVar('DISCORD_CLIENT_SECRET');
export const DISCORD_REDIRECT_URI = getEnvVar('DISCORD_REDIRECT_URI', 'https://raycast.com/redirect?packageName=Extension');
export const DISCORD_API_BASE_URL = getEnvVar('DISCORD_API_BASE_URL', 'https://discord.com/api');
export const DISCORD_API_VERSION = getEnvVar('DISCORD_API_VERSION', 'v10');
export const DISCORD_SCOPES = getEnvVar('DISCORD_SCOPES', 'identify,guilds,messages.read,email');

// Cache Configuration
export const CACHE_TTL = parseInt(getEnvVar('DISCORD_CACHE_TTL', '300000'), 10);
export const CACHE_MAX_SIZE = parseInt(getEnvVar('DISCORD_CACHE_MAX_SIZE', '100'), 10);

// Rate Limiting Configuration
export const MAX_RETRIES = parseInt(getEnvVar('DISCORD_MAX_RETRIES', '3'), 10);
export const RETRY_DELAY = parseInt(getEnvVar('DISCORD_RETRY_DELAY', '1000'), 10);
export const REQUEST_TIMEOUT = parseInt(getEnvVar('DISCORD_TIMEOUT', '10000'), 10);

// Development Configuration
export const IS_DEBUG = getEnvVar('DEBUG', 'false').toLowerCase() === 'true';