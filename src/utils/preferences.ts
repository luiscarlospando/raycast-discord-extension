import { getPreferenceValues, LocalStorage } from "@raycast/api";
import { TokenState } from "./types";

// Define preferences interface
export interface Preferences {
    discordToken: string;
}

// Get token from preferences
export function getToken(): string {
    try {
        const preferences = getPreferenceValues<Preferences>();
        return preferences.discordToken;
    } catch (error) {
        console.error("Failed to get Discord token:", error);
        return "";
    }
}

// Save token state to local storage
export async function saveTokenState(state: TokenState): Promise<void> {
    await LocalStorage.setItem("token-state", JSON.stringify(state));
}

// Get token state from local storage
export async function getTokenState(): Promise<TokenState> {
    const storedState = await LocalStorage.getItem("token-state");
    if (!storedState) {
        return { token: null, loggedIn: false };
    }

    try {
        return JSON.parse(storedState as string) as TokenState;
    } catch (error) {
        console.error("Failed to parse token state:", error);
        return { token: null, loggedIn: false };
    }
}

// Save recently used servers
export async function saveRecentServers(serverIds: string[]): Promise<void> {
    await LocalStorage.setItem("recent-servers", JSON.stringify(serverIds));
}

// Get recently used servers
export async function getRecentServers(): Promise<string[]> {
    const storedIds = await LocalStorage.getItem("recent-servers");
    if (!storedIds) {
        return [];
    }

    try {
        return JSON.parse(storedIds as string) as string[];
    } catch (error) {
        console.error("Failed to parse recent servers:", error);
        return [];
    }
}

// Save recently used channels
export async function saveRecentChannels(channelIds: string[]): Promise<void> {
    await LocalStorage.setItem("recent-channels", JSON.stringify(channelIds));
}

// Get recently used channels
export async function getRecentChannels(): Promise<string[]> {
    const storedIds = await LocalStorage.getItem("recent-channels");
    if (!storedIds) {
        return [];
    }

    try {
        return JSON.parse(storedIds as string) as string[];
    } catch (error) {
        console.error("Failed to parse recent channels:", error);
        return [];
    }
}

// Add a server to recent servers
export async function addRecentServer(serverId: string): Promise<void> {
    const recentServers = await getRecentServers();
    // Remove if already exists and add to front
    const updatedServers = [
        serverId,
        ...recentServers.filter((id) => id !== serverId),
    ].slice(0, 5);
    await saveRecentServers(updatedServers);
}

// Add a channel to recent channels
export async function addRecentChannel(channelId: string): Promise<void> {
    const recentChannels = await getRecentChannels();
    // Remove if already exists and add to front
    const updatedChannels = [
        channelId,
        ...recentChannels.filter((id) => id !== channelId),
    ].slice(0, 10);
    await saveRecentChannels(updatedChannels);
}
