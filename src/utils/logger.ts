import fs from 'fs';
import path from 'path';
import { environment } from "@raycast/api";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: unknown;
}

export class Logger {
    private static instance: Logger;
    private readonly logFile: string;
    private readonly maxLogSize = 5 * 1024 * 1024; // 5MB
    private readonly maxLogFiles = 5;

    private constructor() {
        this.logFile = path.join(__dirname, '../../logs/discord-controller.log');
        this.ensureLogDirectory();
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private ensureLogDirectory(): void {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    private rotateLogFiles(): void {
        if (!fs.existsSync(this.logFile)) {
            return;
        }

        const stats = fs.statSync(this.logFile);
        if (stats.size >= this.maxLogSize) {
            for (let i = this.maxLogFiles - 1; i > 0; i--) {
                const oldFile = `${this.logFile}.${i}`;
                const newFile = `${this.logFile}.${i + 1}`;
                if (fs.existsSync(oldFile)) {
                    if (i === this.maxLogFiles - 1) {
                        fs.unlinkSync(oldFile);
                    } else {
                        fs.renameSync(oldFile, newFile);
                    }
                }
            }
            fs.renameSync(this.logFile, `${this.logFile}.1`);
        }
    }

    private formatLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
    }

    private writeLog(entry: LogEntry): void {
        const logLine = `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}${
            entry.data ? ` ${JSON.stringify(entry.data, null, 2)}` : ''
        }\n`;

        if (environment.isDevelopment) {
            this.rotateLogFiles();
            fs.appendFileSync(this.logFile, logLine);
        }

        // Always output to console in development, only errors in production
        if (environment.isDevelopment || entry.level === 'error') {
            const consoleMethod = entry.level === 'error' ? console.error : console.log;
            consoleMethod(logLine.trim());
        }
    }

    public debug(message: string, data?: unknown): void {
        if (environment.isDevelopment) {
            this.writeLog(this.formatLogEntry('debug', message, data));
        }
    }

    public info(message: string, data?: unknown): void {
        this.writeLog(this.formatLogEntry('info', message, data));
    }

    public warn(message: string, data?: unknown): void {
        this.writeLog(this.formatLogEntry('warn', message, data));
    }

    public error(message: string, error?: Error | unknown): void {
        let errorData: unknown;
        
        if (error instanceof Error) {
            errorData = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                ...(error as any) // Include any additional properties
            };
        } else {
            errorData = error;
        }

        this.writeLog(this.formatLogEntry('error', message, errorData));
    }

    public clearLogs(): void {
        if (fs.existsSync(this.logFile)) {
            fs.unlinkSync(this.logFile);
        }
    }
}

export const logger = Logger.getInstance();