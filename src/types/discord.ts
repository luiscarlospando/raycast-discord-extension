export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string | null;
    accent_color?: number | null;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
}

export interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner?: boolean;
    permissions?: string;
    features: string[];
    approximate_member_count?: number;
    approximate_presence_count?: number;
}

export interface DiscordChannel {
    id: string;
    type: number;
    guild_id?: string;
    position?: number;
    permission_overwrites?: PermissionOverwrite[];
    name?: string;
    topic?: string | null;
    nsfw?: boolean;
    last_message_id?: string | null;
    bitrate?: number;
    user_limit?: number;
    rate_limit_per_user?: number;
    recipients?: DiscordUser[];
    icon?: string | null;
    owner_id?: string;
    application_id?: string;
    parent_id?: string | null;
    last_pin_timestamp?: string | null;
}

export interface PermissionOverwrite {
    id: string;
    type: number;
    allow: string;
    deny: string;
}

export interface DiscordMessage {
    id: string;
    channel_id: string;
    author: DiscordUser;
    content: string;
    timestamp: string;
    edited_timestamp: string | null;
    tts: boolean;
    mention_everyone: boolean;
    mentions: DiscordUser[];
    mention_roles: string[];
    attachments: MessageAttachment[];
    embeds: MessageEmbed[];
    reactions?: MessageReaction[];
    pinned?: boolean;
    type: number;
}

export interface MessageAttachment {
    id: string;
    filename: string;
    size: number;
    url: string;
    proxy_url: string;
    height?: number | null;
    width?: number | null;
}

export interface MessageEmbed {
    title?: string;
    type?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: EmbedFooter;
    thumbnail?: EmbedThumbnail;
    author?: EmbedAuthor;
}

export interface MessageReaction {
    count: number;
    me: boolean;
    emoji: {
        id: string | null;
        name: string;
        animated?: boolean;
    };
}

export interface EmbedFooter {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

export interface EmbedThumbnail {
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
}

export interface EmbedAuthor {
    name: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

export interface DiscordPresence {
    status: 'online' | 'idle' | 'dnd' | 'invisible';
    activities?: DiscordActivity[];
    client_status?: {
        desktop?: string;
        mobile?: string;
        web?: string;
    };
}

export interface DiscordActivity {
    name: string;
    type: number;
    url?: string;
    created_at: number;
    timestamps?: {
        start?: number;
        end?: number;
    };
    application_id?: string;
    details?: string;
    state?: string;
    emoji?: {
        name: string;
        id?: string;
        animated?: boolean;
    };
    party?: {
        id?: string;
        size?: [number, number];
    };
    assets?: {
        large_image?: string;
        large_text?: string;
        small_image?: string;
        small_text?: string;
    };
    secrets?: {
        join?: string;
        spectate?: string;
        match?: string;
    };
    instance?: boolean;
    flags?: number;
}