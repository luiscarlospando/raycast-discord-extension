export interface DiscordServer {
    id: string;
    name: string;
    icon: string | null;
}

export interface DiscordChannel {
    id: string;
    name: string;
    type: number; // 0: text, 2: voice, etc.
    serverId: string;
    serverName: string;
    unreadCount?: number;
}

export interface DiscordMessage {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        avatar: string | null;
    };
    timestamp: string;
    channelId: string;
    channelName: string;
    serverId: string;
    serverName: string;
}

export interface DiscordUnreadMessage extends DiscordMessage {
    mentionCount: number;
}

export type DiscordStatus = "online" | "idle" | "dnd" | "invisible";

export interface DiscordCustomStatus {
    text: string;
    emoji?: string;
    expiresAt?: Date;
}

export interface DiscordNotificationSettings {
    enabled: boolean;
    desktopEnabled: boolean;
    soundEnabled: boolean;
    mentionsOnly: boolean;
}

export interface TokenState {
    token: string | null;
    loggedIn: boolean;
}
