import fetch from "node-fetch";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import {
    DiscordServer,
    DiscordChannel,
    DiscordMessage,
    DiscordUnreadMessage,
    DiscordStatus,
    DiscordCustomStatus,
    DiscordNotificationSettings,
} from "./types";

// Define preferences interface
interface Preferences {
    discordToken: string;
}

// Get Discord token from Raycast preferences
const getToken = (): string => {
    try {
        const preferences = getPreferenceValues<Preferences>();
        return preferences.discordToken;
    } catch (error) {
        console.error("Failed to get Discord token:", error);
        return "";
    }
};

// Base Discord API URL
const API_BASE = "https://discord.com/api/v10";

// Headers for Discord API requests
const getHeaders = () => ({
    Authorization: getToken(),
    "Content-Type": "application/json",
});

// Generic API request function
async function apiRequest<T>(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, unknown>
): Promise<T> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Discord API Error: ${errorData.message || response.statusText}`
            );
        }

        return (await response.json()) as T;
    } catch (error) {
        console.error(`Discord API request failed: ${error}`);
        await showToast({
            style: Toast.Style.Failure,
            title: "Discord API Error",
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        });
        throw error;
    }
}

// Get all servers (guilds) the user is in
export async function getServers(): Promise<DiscordServer[]> {
    const guilds = await apiRequest<any[]>("/users/@me/guilds");
    return guilds.map((guild) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
            : null,
    }));
}

// Get all channels for a specific server
export async function getChannels(serverId: string): Promise<DiscordChannel[]> {
    const channels = await apiRequest<any[]>(`/guilds/${serverId}/channels`);
    return channels
        .filter((channel) => channel.type === 0) // Only text channels
        .map((channel) => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            serverId,
            serverName: "", // Will be filled in by the caller
        }));
}

// Search messages in a specific channel
export async function searchMessages(
    channelId: string,
    query: string,
    limit: number = 25
): Promise<DiscordMessage[]> {
    const messages = await apiRequest<any[]>(
        `/channels/${channelId}/messages/search?content=${encodeURIComponent(query)}&limit=${limit}`
    );

    return messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        author: {
            id: msg.author.id,
            username: msg.author.username,
            avatar: msg.author.avatar
                ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
                : null,
        },
        timestamp: msg.timestamp,
        channelId,
        channelName: "", // Will be filled in by the caller
        serverId: msg.guild_id,
        serverName: "", // Will be filled in by the caller
    }));
}

// Get unread messages
export async function getUnreadMessages(): Promise<DiscordUnreadMessage[]> {
    const unreadMessages = await apiRequest<any[]>(
        "/users/@me/channels/@me/messages/unread"
    );

    return unreadMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        author: {
            id: msg.author.id,
            username: msg.author.username,
            avatar: msg.author.avatar
                ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
                : null,
        },
        timestamp: msg.timestamp,
        channelId: msg.channel_id,
        channelName: "", // Will be filled in by the caller
        serverId: msg.guild_id,
        serverName: "", // Will be filled in by the caller
        mentionCount: msg.mention_count || 0,
    }));
}

// Get notification settings
export async function getNotificationSettings(): Promise<DiscordNotificationSettings> {
    const settings = await apiRequest<any>("/users/@me/settings");

    return {
        enabled: !settings.disable_notifications,
        desktopEnabled: settings.enable_desktop_notifications,
        soundEnabled: settings.enable_notification_sounds,
        mentionsOnly: settings.muted_channels.length > 0,
    };
}

// Update notification settings
export async function updateNotificationSettings(
    settings: Partial<DiscordNotificationSettings>
): Promise<DiscordNotificationSettings> {
    const updateData: Record<string, unknown> = {};

    if (settings.enabled !== undefined) {
        updateData.disable_notifications = !settings.enabled;
    }

    if (settings.desktopEnabled !== undefined) {
        updateData.enable_desktop_notifications = settings.desktopEnabled;
    }

    if (settings.soundEnabled !== undefined) {
        updateData.enable_notification_sounds = settings.soundEnabled;
    }

    const updatedSettings = await apiRequest<any>(
        "/users/@me/settings",
        "PATCH",
        updateData
    );

    return {
        enabled: !updatedSettings.disable_notifications,
        desktopEnabled: updatedSettings.enable_desktop_notifications,
        soundEnabled: updatedSettings.enable_notification_sounds,
        mentionsOnly: updatedSettings.muted_channels.length > 0,
    };
}

// Update status
export async function updateStatus(status: DiscordStatus): Promise<void> {
    await apiRequest("/users/@me/settings", "PATCH", { status });
}

// Update custom status
export async function updateCustomStatus(
    customStatus: DiscordCustomStatus
): Promise<void> {
    const updateData: Record<string, unknown> = {
        custom_status: {
            text: customStatus.text,
        },
    };

    if (customStatus.emoji) {
        updateData.custom_status.emoji_name = customStatus.emoji;
    }

    if (customStatus.expiresAt) {
        updateData.custom_status.expires_at =
            customStatus.expiresAt.toISOString();
    }

    await apiRequest("/users/@me/settings", "PATCH", updateData);
}

// Open Discord channel
export function openDiscordChannel(channelId: string): void {
    const url = `discord://discord.com/channels/@me/${channelId}`;
    // Use macOS `open` command to launch Discord
    const { exec } = require("child_process");
    exec(`open "${url}"`);
}

// Validate Discord token
export async function validateToken(token: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/users/@me`, {
            method: "GET",
            headers: {
                Authorization: token,
            },
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Check if user is logged in
export async function checkLoggedIn(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    return validateToken(token);
}
