import { useState, useEffect } from "react";
import {
    List,
    ActionPanel,
    Action,
    showToast,
    Toast,
    Icon,
    getPreferenceValues,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { DiscordServer, DiscordChannel } from "./utils/types";
import {
    getServers,
    getChannels,
    openDiscordChannel,
    checkLoggedIn,
} from "./utils/discord-api";
import {
    addRecentServer,
    addRecentChannel,
    getRecentServers,
    getRecentChannels,
} from "./utils/preferences";

export default function OpenChannels() {
    // State
    const [selectedServerId, setSelectedServerId] = useState<string | null>(
        null
    );
    const [recentServers, setRecentServers] = useState<string[]>([]);
    const [recentChannels, setRecentChannels] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Fetch servers
    const {
        data: servers,
        isLoading: isLoadingServers,
        error: serversError,
        revalidate: revalidateServers,
    } = useCachedPromise(
        async () => {
            if (!isLoggedIn) return [];
            return getServers();
        },
        [],
        { keepPreviousData: true }
    );

    // Fetch channels for selected server
    const {
        data: channels,
        isLoading: isLoadingChannels,
        error: channelsError,
        revalidate: revalidateChannels,
    } = useCachedPromise(
        async () => {
            if (!selectedServerId || !isLoggedIn) return [];

            const channelList = await getChannels(selectedServerId);
            const server = servers?.find((s) => s.id === selectedServerId);

            // Add server name to channels
            return channelList.map((channel) => ({
                ...channel,
                serverName: server?.name || "Unknown Server",
            }));
        },
        [selectedServerId, servers],
        { keepPreviousData: true }
    );

    // Load initial data
    useEffect(() => {
        const checkLogin = async () => {
            const loggedIn = await checkLoggedIn();
            setIsLoggedIn(loggedIn);

            if (!loggedIn) {
                showToast({
                    style: Toast.Style.Failure,
                    title: "Not Logged In",
                    message: "Please set your Discord token in preferences",
                });
            }
        };

        const loadRecents = async () => {
            const recentServerIds = await getRecentServers();
            setRecentServers(recentServerIds);

            const recentChannelIds = await getRecentChannels();
            setRecentChannels(recentChannelIds);
        };

        checkLogin();
        loadRecents();
    }, []);

    // Handle server selection
    const handleSelectServer = async (serverId: string) => {
        setSelectedServerId(serverId);
        await addRecentServer(serverId);
        const recentServerIds = await getRecentServers();
        setRecentServers(recentServerIds);
    };

    // Handle channel opening
    const handleOpenChannel = async (channel: DiscordChannel) => {
        openDiscordChannel(channel.id);
        await addRecentChannel(channel.id);
        const recentChannelIds = await getRecentChannels();
        setRecentChannels(recentChannelIds);
    };

    // Get recent channels with full details
    const getRecentChannelsWithDetails = (): DiscordChannel[] => {
        if (!channels || !servers) return [];

        return recentChannels
            .map((channelId) => {
                const channel = channels.find((c) => c.id === channelId);
                if (channel) return channel;
                return null;
            })
            .filter((c): c is DiscordChannel => c !== null);
    };

    // Handle errors
    if (serversError) {
        showToast({
            style: Toast.Style.Failure,
            title: "Failed to load servers",
            message: serversError.message,
        });
    }

    if (channelsError) {
        showToast({
            style: Toast.Style.Failure,
            title: "Failed to load channels",
            message: channelsError.message,
        });
    }

    // Render function
    return (
        <List
            isLoading={isLoadingServers || isLoadingChannels}
            searchBarPlaceholder="Search servers and channels..."
            navigationTitle="Discord Channels"
            isShowingDetail
        >
            {!isLoggedIn ? (
                <List.EmptyView
                    title="Not Logged In"
                    description="Please set your Discord token in Raycast preferences"
                    icon={Icon.PersonDisabled}
                />
            ) : (
                <>
                    {/* Display recent channels */}
                    {getRecentChannelsWithDetails().length > 0 && (
                        <List.Section title="Recent Channels">
                            {getRecentChannelsWithDetails().map((channel) => (
                                <List.Item
                                    key={channel.id}
                                    icon={Icon.Calendar}
                                    title={channel.name}
                                    subtitle={channel.serverName}
                                    detail={
                                        <List.Item.Detail
                                            markdown={`# ${channel.name}\n\nServer: **${channel.serverName}**`}
                                            metadata={
                                                <List.Item.Detail.Metadata>
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Channel"
                                                        text={channel.name}
                                                    />
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Server"
                                                        text={
                                                            channel.serverName
                                                        }
                                                    />
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Channel ID"
                                                        text={channel.id}
                                                    />
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Server ID"
                                                        text={channel.serverId}
                                                    />
                                                </List.Item.Detail.Metadata>
                                            }
                                        />
                                    }
                                    actions={
                                        <ActionPanel>
                                            <Action
                                                title="Open Channel"
                                                onAction={() =>
                                                    handleOpenChannel(channel)
                                                }
                                            />
                                        </ActionPanel>
                                    }
                                />
                            ))}
                        </List.Section>
                    )}

                    {/* Servers List */}
                    <List.Section title="Servers">
                        {servers?.map((server) => (
                            <List.Item
                                key={server.id}
                                icon={
                                    server.icon
                                        ? { source: server.icon }
                                        : Icon.Globe
                                }
                                title={server.name}
                                actions={
                                    <ActionPanel>
                                        <Action
                                            title="Show Channels"
                                            onAction={() =>
                                                handleSelectServer(server.id)
                                            }
                                        />
                                    </ActionPanel>
                                }
                            />
                        ))}
                    </List.Section>

                    {/* Channels List for Selected Server */}
                    {selectedServerId && (
                        <List.Section title="Channels">
                            {channels?.map((channel) => (
                                <List.Item
                                    key={channel.id}
                                    icon={Icon.Hash}
                                    title={channel.name}
                                    subtitle={channel.serverName}
                                    detail={
                                        <List.Item.Detail
                                            markdown={`# ${channel.name}\n\nServer: **${channel.serverName}**`}
                                            metadata={
                                                <List.Item.Detail.Metadata>
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Channel"
                                                        text={channel.name}
                                                    />
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Server"
                                                        text={
                                                            channel.serverName
                                                        }
                                                    />
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Channel ID"
                                                        text={channel.id}
                                                    />
                                                    <List.Item.Detail.Metadata.Label
                                                        title="Server ID"
                                                        text={channel.serverId}
                                                    />
                                                </List.Item.Detail.Metadata>
                                            }
                                        />
                                    }
                                    actions={
                                        <ActionPanel>
                                            <Action
                                                title="Open Channel"
                                                onAction={() =>
                                                    handleOpenChannel(channel)
                                                }
                                            />
                                        </ActionPanel>
                                    }
                                />
                            ))}
                        </List.Section>
                    )}
                </>
            )}
        </List>
    );
}
