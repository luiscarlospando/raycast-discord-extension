import { authorize, client, refreshTokens } from "./auth";
import fetch from "node-fetch";

const API_BASE = "https://discord.com/api/v10";

// Rate limiting configuration
interface RateLimit {
    limit: number;
    remaining: number;
    reset: number;
}

const rateLimits: Map<string, RateLimit> = new Map();
const REQUEST_QUEUE: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

async function processRequestQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (REQUEST_QUEUE.length > 0) {
        const request = REQUEST_QUEUE.shift();
        if (request) {
            try {
                await request();
            } catch (error) {
                console.error("Error processing queued request:", error);
            }
            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    isProcessingQueue = false;
}

function updateRateLimit(endpoint: string, headers: Headers) {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");

    if (limit && remaining && reset) {
        rateLimits.set(endpoint, {
            limit: parseInt(limit),
            remaining: parseInt(remaining),
            reset: parseInt(reset) * 1000, // Convert to milliseconds
        });
    }
}

function isRateLimited(endpoint: string): boolean {
    const rateLimit = rateLimits.get(endpoint);
    if (!rateLimit) return false;

    const now = Date.now();
    if (now >= rateLimit.reset) {
        rateLimits.delete(endpoint);
        return false;
    }

    return rateLimit.remaining <= 0;
}

async function waitForRateLimit(endpoint: string): Promise<void> {
    const rateLimit = rateLimits.get(endpoint);
    if (!rateLimit) return;

    const now = Date.now();
    const timeToWait = rateLimit.reset - now;
    if (timeToWait > 0) {
        await new Promise(resolve => setTimeout(resolve, timeToWait + 100)); // Add 100ms buffer
    }
}

async function handleTokenRefresh(): Promise<string | null> {
    const tokens = await client.getTokens();
    if (!tokens?.refreshToken) {
        return null;
    }

    try {
        const newTokens = await refreshTokens(tokens.refreshToken);
        return newTokens.accessToken;
    } catch (error) {
        console.error("Token refresh failed:", error);
        await client.removeTokens();
        return null;
    }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const makeRequest = async () => {
        try {
            if (isRateLimited(endpoint)) {
                await waitForRateLimit(endpoint);
            }

            const tokens = await client.getTokens();
            let accessToken = tokens?.accessToken;

            if (!accessToken) {
                accessToken = await authorize();
                if (!accessToken) {
                    throw new Error("Failed to obtain access token");
                }
            }

            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    ...options.headers,
                },
            });

            updateRateLimit(endpoint, response.headers);

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get("retry-after") || "5");
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return apiRequest(endpoint, options);
            }

            if (response.status === 401) {
                const newToken = await handleTokenRefresh();
                if (!newToken) {
                    const freshToken = await authorize();
                    if (!freshToken) {
                        throw new Error("Failed to refresh authorization");
                    }
                    accessToken = freshToken;
                } else {
                    accessToken = newToken;
                }

                return apiRequest(endpoint, options);
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Discord API error: ${response.status} ${response.statusText}\n${errorText}`);
            }

            return response.json();
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    };

    return new Promise((resolve, reject) => {
        REQUEST_QUEUE.push(async () => {
            try {
                const result = await makeRequest();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        processRequestQueue();
    });
}

export async function getCurrentUser() {
    return apiRequest("/users/@me");
}

export async function getUserGuilds() {
    return apiRequest("/users/@me/guilds");
}

export async function getGuild(guildId: string) {
    return apiRequest(`/guilds/${guildId}`);
}

export async function getServers() {
    console.log("Fetching user's servers (guilds)");
    return getUserGuilds();
}

export async function getChannels(serverId: string) {
    console.log(`Fetching channels for server ${serverId}`);
    return apiRequest(`/guilds/${serverId}/channels`);
}

export async function getMessages(channelId: string, limit = 50) {
    console.log(`Fetching messages for channel ${channelId}`);
    return apiRequest(`/channels/${channelId}/messages?limit=${limit}`);
}

export async function searchMessages(channelId: string, query: string) {
    console.log(`Searching messages in channel ${channelId} for "${query}"`);
    const messages = await getMessages(channelId, 100);
    return messages.filter((msg: any) =>
        msg.content.toLowerCase().includes(query.toLowerCase())
    );
}

export async function getUnreadMessages() {
    console.log("Fetching unread messages");
    const guilds = await getUserGuilds();
    const unreadMessages = [];

    for (const guild of guilds) {
        try {
            const channels = await getChannels(guild.id);
            const textChannels = channels.filter(
                (channel: any) => channel.type === 0
            );

            for (const channel of textChannels) {
                try {
                    const messages = await getMessages(channel.id, 5);
                    if (messages.length > 0) {
                        messages.forEach((msg: any) => {
                            unreadMessages.push({
                                ...msg,
                                guild_name: guild.name,
                                guild_id: guild.id,
                                channel_name: channel.name,
                                channel_id: channel.id,
                            });
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching messages for channel ${channel.id}:`, error);
                }
            }
        } catch (error) {
            console.error(`Error fetching channels for guild ${guild.id}:`, error);
        }
    }

    return unreadMessages;
}

export async function toggleNotifications(channelId: string, enabled: boolean) {
    console.log(`${enabled ? "Enabling" : "Disabling"} notifications for channel ${channelId}`);
    return apiRequest(`/channels/${channelId}`, {
        method: "PATCH",
        body: JSON.stringify({
            notification_settings: {
                muted: !enabled,
            },
        }),
    });
}

export async function setStatus(status: string, customMessage?: string) {
    console.log(`Setting status to ${status}${customMessage ? ` with message: ${customMessage}` : ""}`);

    const validStatuses = ["online", "idle", "dnd", "invisible"];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    }

    const statusPayload: any = {
        status,
    };

    if (customMessage) {
        statusPayload.custom_status = {
            text: customMessage,
        };
    }

    return apiRequest(`/users/@me/settings`, {
        method: "PATCH",
        body: JSON.stringify(statusPayload),
    });
}