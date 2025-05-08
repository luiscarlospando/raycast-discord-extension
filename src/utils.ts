import { Image } from "@raycast/api";

// Get Discord avatar URL
export function getAvatarUrl(userId: string, avatarHash: string): string {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
}

// Get Discord server icon URL
export function getServerIconUrl(serverId: string, iconHash: string): string {
    return `https://cdn.discordapp.com/icons/${serverId}/${iconHash}.png`;
}

// Format timestamps
export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
}
