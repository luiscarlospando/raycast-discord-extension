import { OAuth } from "@raycast/api";
import fetch, { RequestInit, Response } from "node-fetch";
import { rateLimiter } from "./rate-limiter";
import { logger } from "./logger";
import { config } from "../config";
import {
    AuthenticationError,
    DiscordError,
    NetworkError,
    ServerError,
    ValidationError
} from "../types/errors";
import {
    DiscordUser,
    DiscordGuild,
    DiscordChannel,
    DiscordMessage,
    DiscordPresence
} from "../types/discord";

interface APIOptions extends RequestInit {
    retries?: number;
    timeout?: number;
    requireAuth?: boolean;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export class DiscordAPI {
    private static instance: DiscordAPI;
    private accessToken: string | null = null;
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
    private readonly maxRetries = 3;
    private readonly timeout = 10000; // 10 seconds

    private constructor() {}

    public static getInstance(): DiscordAPI {
        if (!DiscordAPI.instance) {
            DiscordAPI.instance = new DiscordAPI();
        }
        return DiscordAPI.instance;
    }

    public setAccessToken(token: string): void {
        this.accessToken = token;
    }

    public clearCache(): void {
        this.cache.clear();
    }

    private getCached<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;

        if (Date.now() - entry.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    private setCache<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    private async request<T>(
        endpoint: string,
        options: APIOptions = {}
    ): Promise<T> {
        const {
            retries = this.maxRetries,
            timeout = this.timeout,
            requireAuth = true,
            ...fetchOptions
        } = options;

        if (requireAuth && !this.accessToken) {
            throw new AuthenticationError("No access token available");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            await rateLimiter.acquire(endpoint);

            const response = await fetch(
                `${config.discord.api.baseUrl}${endpoint}`,
                {
                    ...fetchOptions,
                    signal: controller.signal,
                    headers: {
                        "Accept": "application/json",
                        "Authorization": requireAuth ? `Bearer ${this.accessToken}` : "",
                        ...fetchOptions.headers,
                    },
                }
            );

            clearTimeout(timeoutId);
            rateLimiter.update(endpoint, response.headers);

            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new NetworkError("Request timed out");
            }

            if (retries > 0 && error instanceof Error && error.message.includes("network")) {
                logger.warn(`Retrying request to ${endpoint}, ${retries} attempts remaining`);
                return this.request(endpoint, { ...options, retries: retries - 1 });
            }

            throw error;
        }
    }

    private async handleErrorResponse(response: Response): Promise<never> {
        const error = await response.json().catch(() => ({}));
        
        switch (response.status) {
            case 400:
                throw new ValidationError(error.message || "Invalid request", error);
            case 401:
                throw new AuthenticationError("Authentication failed", error);
            case 403:
                throw new ValidationError("Permission denied", error);
            case 404:
                throw new ValidationError("Resource not found", error);
            case 429:
                const retryAfter = parseInt(response.headers.get("Retry-After") || "5");
                throw new DiscordError(
                    "Rate limit exceeded",
                    "RATE_LIMIT",
                    429,
                    { retryAfter }
                );
            case 500:
            case 502:
            case 503:
            case 504:
                throw new ServerError("Discord API error", error);
            default:
                throw new DiscordError(
                    error.message || "Unknown error",
                    "UNKNOWN",
                    response.status,
                    error
                );
        }
    }

    // User endpoints
    public async getCurrentUser(): Promise<DiscordUser> {
        const cached = this.getCached<DiscordUser>("me");
        if (cached) return cached;

        const user = await this.request<DiscordUser>("/users/@me");
        this.setCache("me", user);
        return user;
    }

    // Guild endpoints
    public async getGuilds(): Promise<DiscordGuild[]> {
        const cached = this.getCached<DiscordGuild[]>("guilds");
        if (cached) return cached;

        const guilds = await this.request<DiscordGuild[]>("/users/@me/guilds");
        this.setCache("guilds", guilds);
        return guilds;
    }

    public async getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
        const cacheKey = `guild:${guildId}:channels`;
        const cached = this.getCached<DiscordChannel[]>(cacheKey);
        if (cached) return cached;

        const channels = await this.request<DiscordChannel[]>(
            `/guilds/${guildId}/channels`
        );
        this.setCache(cacheKey, channels);
        return channels;
    }

    // Message endpoints
    public async getChannelMessages(
        channelId: string,
        limit = 50
    ): Promise<DiscordMessage[]> {
        return this.request<DiscordMessage[]>(
            `/channels/${channelId}/messages?limit=${limit}`
        );
    }

    public async searchMessages(
        guildId: string,
        query: string,
        options: {
            authorId?: string;
            channelId?: string;
            limit?: number;
        } = {}
    ): Promise<DiscordMessage[]> {
        const params = new URLSearchParams({
            content: query,
            ...(options.authorId && { author_id: options.authorId }),
            ...(options.channelId && { channel_id: options.channelId }),
            ...(options.limit && { limit: options.limit.toString() })
        });

        return this.request<DiscordMessage[]>(
            `/guilds/${guildId}/messages/search?${params}`
        );
    }

    // Presence endpoints
    public async updatePresence(presence: DiscordPresence): Promise<void> {
        await this.request("/users/@me/settings", {
            method: "PATCH",
            body: JSON.stringify(presence),
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    // Notification endpoints
    public async updateNotificationSettings(
        guildId: string,
        settings: {
            muted?: boolean;
            messageNotifications?: number;
            mobilePush?: boolean;
        }
    ): Promise<void> {
        await this.request(`/users/@me/guilds/${guildId}/settings`, {
            method: "PATCH",
            body: JSON.stringify(settings),
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}

export const discordAPI = DiscordAPI.getInstance();