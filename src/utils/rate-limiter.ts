import { RateLimitError } from '../types/errors';
import { logger } from './logger';

interface RateLimitInfo {
    remaining: number;
    reset: number;
    total: number;
    promise?: Promise<void>;
}

export class RateLimiter {
    private static instance: RateLimiter;
    private queue: Map<string, RateLimitInfo> = new Map();
    private globalRateLimit: { reset: number; promise?: Promise<void> } | null = null;

    private constructor() {}

    public static getInstance(): RateLimiter {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }

    private async wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async acquire(route: string): Promise<void> {
        const now = Date.now();

        // Check global rate limit
        if (this.globalRateLimit && now < this.globalRateLimit.reset) {
            if (!this.globalRateLimit.promise) {
                this.globalRateLimit.promise = this.wait(this.globalRateLimit.reset - now);
            }
            await this.globalRateLimit.promise;
            this.globalRateLimit = null;
        }

        // Check route-specific rate limit
        const limit = this.queue.get(route);
        if (limit) {
            if (now < limit.reset) {
                if (limit.remaining <= 0) {
                    if (!limit.promise) {
                        const waitTime = limit.reset - now;
                        logger.debug(`Rate limit hit for route ${route}, waiting ${waitTime}ms`);
                        limit.promise = this.wait(waitTime);
                    }
                    await limit.promise;
                    limit.promise = undefined;
                    limit.remaining = limit.total;
                    limit.reset = now + 5000; // Default reset after waiting
                }
                limit.remaining--;
            } else {
                // Reset has passed
                limit.remaining = limit.total - 1;
                limit.reset = now + 5000;
                limit.promise = undefined;
            }
        } else {
            // Initialize new route limit
            this.queue.set(route, {
                remaining: 4,
                reset: now + 5000,
                total: 5
            });
        }
    }

    public update(route: string, headers: Headers): void {
        const remaining = parseInt(headers.get('X-RateLimit-Remaining') || '0');
        const reset = parseInt(headers.get('X-RateLimit-Reset') || '0') * 1000;
        const total = parseInt(headers.get('X-RateLimit-Limit') || '5');
        const global = headers.get('X-RateLimit-Global');
        const retryAfter = headers.get('Retry-After');

        if (global && retryAfter) {
            const retryMs = parseInt(retryAfter) * 1000;
            this.globalRateLimit = {
                reset: Date.now() + retryMs
            };
            logger.warn(`Global rate limit hit, retry after ${retryMs}ms`);
            throw new RateLimitError(`Global rate limit exceeded`, retryMs);
        }

        this.queue.set(route, {
            remaining,
            reset,
            total
        });

        if (remaining === 0) {
            const retryMs = reset - Date.now();
            logger.warn(`Rate limit hit for route ${route}, retry after ${retryMs}ms`);
            throw new RateLimitError(`Rate limit exceeded for ${route}`, retryMs);
        }
    }

    public clear(): void {
        this.queue.clear();
        this.globalRateLimit = null;
    }
}

export const rateLimiter = RateLimiter.getInstance();