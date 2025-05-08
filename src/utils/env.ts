import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { environment } from "@raycast/api";
import { logger } from './logger';

interface EnvConfig {
    required: string[];
    optional: string[];
}

const envConfig: EnvConfig = {
    required: [
        'DISCORD_CLIENT_ID',
        'DISCORD_CLIENT_SECRET',
    ],
    optional: [
        'DISCORD_API_BASE_URL',
        'DISCORD_API_VERSION',
        'NODE_ENV',
        'DEBUG',
        'RATE_LIMIT_MAX_RETRIES',
        'RATE_LIMIT_RETRY_DELAY',
        'REQUEST_TIMEOUT',
        'CACHE_TTL',
        'CACHE_MAX_SIZE',
        'LOG_LEVEL',
        'LOG_FILE_PATH',
    ],
};

function validateEnvironment(): void {
    const missingVars = envConfig.required.filter(
        (name) => !process.env[name]
    );

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}`
        );
    }
}

function getEnvFilePath(): string {
    const possiblePaths = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.local'),
        path.join(__dirname, '../../.env'),
        path.join(__dirname, '../../.env.local'),
    ];

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }

    return possiblePaths[0];
}

export function loadEnvironmentVariables(): void {
    const envPath = getEnvFilePath();

    try {
        if (fs.existsSync(envPath)) {
            const envConfig = dotenv.parse(fs.readFileSync(envPath));
            
            for (const key in envConfig) {
                if (!process.env[key]) {
                    process.env[key] = envConfig[key];
                }
            }
            
            logger.debug(`Loaded environment variables from ${envPath}`);
        } else {
            logger.warn(`No .env file found at ${envPath}`);
            
            if (fs.existsSync(`${envPath}.example`)) {
                logger.info('Found .env.example file. Please copy it to .env and update the values.');
            }
        }

        validateEnvironment();
    } catch (error) {
        logger.error('Error loading environment variables:', error);
        throw error;
    }
}

export function getEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name] || defaultValue;
    
    if (value === undefined && envConfig.required.includes(name)) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    
    return value || '';
}

export function getNumericEnvVar(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (!value) return defaultValue;

    const numericValue = parseInt(value, 10);
    return isNaN(numericValue) ? defaultValue : numericValue;
}

export function getBooleanEnvVar(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]?.toLowerCase();
    if (!value) return defaultValue;
    
    return ['true', '1', 'yes'].includes(value);
}

export default {
    loadEnvironmentVariables,
    getEnvVar,
    getNumericEnvVar,
    getBooleanEnvVar,
};