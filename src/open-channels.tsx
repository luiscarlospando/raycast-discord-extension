import { List, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { fetchFromDiscord, isAuthenticated } from "../oauth";
import { AuthView } from "../components/AuthView";

interface Guild {
    id: string;
    name: string;
    icon: string | null;
}

interface Channel {
    id: string;
    name: string;
    type: number;
    parent_id: string | null;
}

export default function Command() {
    const [isLoading, setIsLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (authenticated) {
            loadGuilds();
        }
    }, [authenticated]);

    useEffect(() => {
        if (selectedGuildId) {
            loadChannels(selectedGuildId);
        }
    }, [selectedGuildId]);

    async function checkAuth() {
        const isAuth = await isAuthenticated();
        setAuthenticated(isAuth);
        setIsLoading(false);
    }

    async function loadGuilds() {
        try {
            setIsLoading(true);
            const data = await fetchFromDiscord("/users/@me/guilds");
            setGuilds(data);
        } catch (error) {
            console.error("Error loading servers:", error);
            await showToast({
                style: Toast.Style.Failure,
                title: "Error loading servers",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function loadChannels(guildId: string) {
        try {
            setIsLoading(true);
            const data = await fetchFromDiscord(`/guilds/${guildId}/channels`);
            // Filter only text channels (type 0) and categories (type 4)
            setChannels(
                data.filter((channel: Channel) =>
                    [0, 2, 4, 5].includes(channel.type)
                )
            );
        } catch (error) {
            console.error("Error loading channels:", error);
            await showToast({
                style: Toast.Style.Failure,
                title: "Error loading channels",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsLoading(false);
        }
    }

    function getChannelTypeIcon(type: number) {
        switch (type) {
            case 0:
                return "🗨️"; // Text channel
            case 2:
                return "🔊"; // Voice channel
            case 4:
                return "📁"; // Category
            case 5:
                return "📢"; // Announcement channel
            default:
                return "❓";
        }
    }

    function openDiscordChannel(guildId: string, channelId: string) {
        // Open channel in Discord
        const url = `discord://discord.com/channels/${guildId}/${channelId}`;
        open(url);
    }

    if (!authenticated) {
        return <AuthView onAuthenticated={() => setAuthenticated(true)} />;
    }

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder={
                selectedGuildId ? "Search channels..." : "Search servers..."
            }
            onSelectionChange={(id) => {
                if (id && !selectedGuildId) {
                    setSelectedGuildId(id as string);
                }
            }}
            navigationTitle={
                selectedGuildId ? "Discord Channels" : "Discord Servers"
            }
        >
            {selectedGuildId ? (
                <>
                    <List.Section title="Channels">
                        {channels.map((channel) => (
                            <List.Item
                                key={channel.id}
                                id={channel.id}
                                title={`${getChannelTypeIcon(channel.type)} ${channel.name}`}
                                accessories={[
                                    {
                                        text:
                                            channel.type === 4
                                                ? "Category"
                                                : "Channel",
                                    },
                                ]}
                                actions={
                                    <ActionPanel>
                                        {channel.type !== 4 && (
                                            <Action
                                                title="Open Channel"
                                                onAction={() =>
                                                    openDiscordChannel(
                                                        selectedGuildId,
                                                        channel.id
                                                    )
                                                }
                                            />
                                        )}
                                        <Action
                                            title="Back to Servers"
                                            onAction={() => {
                                                setSelectedGuildId(null);
                                                setChannels([]);
                                            }}
                                        />
                                    </ActionPanel>
                                }
                            />
                        ))}
                    </List.Section>
                </>
            ) : (
                <>
                    <List.Section title="Servers">
                        {guilds.map((guild) => (
                            <List.Item
                                key={guild.id}
                                id={guild.id}
                                title={guild.name}
                                icon={
                                    guild.icon
                                        ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                                        : "discord-icon.png"
                                }
                                actions={
                                    <ActionPanel>
                                        <Action
                                            title="View Channels"
                                            onAction={() =>
                                                setSelectedGuildId(guild.id)
                                            }
                                        />
                                    </ActionPanel>
                                }
                            />
                        ))}
                    </List.Section>
                </>
            )}
        </List>
    );
}
