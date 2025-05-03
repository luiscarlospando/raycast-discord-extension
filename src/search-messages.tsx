import { useState, useEffect } from "react";
import {
    List,
    ActionPanel,
    Action,
    showToast,
    Toast,
    Icon,
    useNavigation,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { DiscordServer, DiscordChannel, DiscordMessage } from "./utils/types";
import {
    getServers,
    getChannels,
    searchMessages,
    openDiscordChannel,
    checkLoggedIn,
} from "./utils/discord-api";
import { addRecentServer, addRecentChannel } from "./utils/preferences";

// Channel selection component
function ChannelSelector(props: {
    onChannelSelect: (channel: DiscordChannel) => void;
}) {
    const [selectedServerId, setSelectedServerId] = useState<string | null>(
        null
    );
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

    // Check login status
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

        checkLogin();
    }, []);

    // Fetch servers
    const {
        data: servers,
        isLoading: isLoadingServers,
        error: serversError,
    } = useCachedPromise(
        async () => {
            if (!isLoggedIn) return [];
            return getServers();
        },
        [isLoggedIn],
        { keepPreviousData: true }
    );

    // Fetch channels for selected server
    const {
        data: channels,
        isLoading: isLoadingChannels,
        error: channelsError,
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
        [selectedServerId, servers, isLoggedIn],
        { keepPreviousData: true }
    );

    // Handle server selection
    const handleSelectServer = async (serverId: string) => {
        setSelectedServerId(serverId);
        await addRecentServer(serverId);
    };

    // Handle channel selection
    const handleSelectChannel = async (channel: DiscordChannel) => {
        await addRecentChannel(channel.id);
        props.onChannelSelect(channel);
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

    return (
        <List
            isLoading={isLoadingServers || isLoadingChannels}
            searchBarPlaceholder="Search servers and channels..."
            navigationTitle="Select Discord Channel"
        >
            {!isLoggedIn ? (
                <List.EmptyView
                    title="Not Logged In"
                    description="Please set your Discord token in Raycast preferences"
                    icon={Icon.PersonDisabled}
                />
            ) : (
                <>
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
                                    actions={
                                        <ActionPanel>
                                            <Action
                                                title="Select Channel"
                                                onAction={() =>
                                                    handleSelectChannel(channel)
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

// Message search component
function MessageSearch(props: { channel: DiscordChannel }) {
    const { channel } = props;
    const [searchQuery, setSearchQuery] = useState<string>("");
    const { pop } = useNavigation();

    // Search messages
    const {
        data: messages,
        isLoading,
        error,
        revalidate,
    } = useCachedPromise(
        async (query: string) => {
            if (!query || query.length < 2) return [];
            return searchMessages(channel.id, query);
        },
        [searchQuery, channel.id],
        { keepPreviousData: true }
    );

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Handle opening a message
    const handleOpenMessage = (message: DiscordMessage) => {
        // Discord doesn't have direct message links, so we open the channel
        openDiscordChannel(message.channelId);
    };

    // Handle errors
    if (error) {
        showToast({
            style: Toast.Style.Failure,
            title: "Failed to search messages",
            message: error.message,
        });
    }

    return (
        <List
            isLoading={isLoading}
            onSearchTextChange={setSearchQuery}
            searchBarPlaceholder={`Search messages in #${channel.name}...`}
            navigationTitle={`Search in #${channel.name}`}
            isShowingDetail
        >
            <List.Section
                title="Search Results"
                subtitle={messages?.length.toString() || "0"}
            >
                {searchQuery.length < 2 ? (
                    <List.EmptyView
                        title="Enter at least 2 characters to search"
                        icon={Icon.MagnifyingGlass}
                    />
                ) : messages?.length === 0 ? (
                    <List.EmptyView
                        title="No messages found"
                        description={`No messages matching "${searchQuery}" in #${channel.name}`}
                        icon={Icon.QuestionMark}
                    />
                ) : (
                    messages?.map((message) => (
                        <List.Item
                            key={message.id}
                            icon={
                                message.author.avatar
                                    ? { source: message.author.avatar }
                                    : Icon.Person
                            }
                            title={
                                message.content.length > 60
                                    ? message.content.substring(0, 60) + "..."
                                    : message.content
                            }
                            subtitle={message.author.username}
                            accessories={[
                                { text: formatDate(message.timestamp) },
                            ]}
                            detail={
                                <List.Item.Detail
                                    markdown={`# Message in #${channel.name}\n\n${message.content}\n\n**Author**: ${message.author.username}\n\n**Sent**: ${formatDate(message.timestamp)}`}
                                    metadata={
                                        <List.Item.Detail.Metadata>
                                            <List.Item.Detail.Metadata.Label
                                                title="Author"
                                                text={message.author.username}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Channel"
                                                text={`#${channel.name}`}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Server"
                                                text={channel.serverName}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Date"
                                                text={formatDate(
                                                    message.timestamp
                                                )}
                                            />
                                            <List.Item.Detail.Metadata.Separator />
                                            <List.Item.Detail.Metadata.Label
                                                title="Message ID"
                                                text={message.id}
                                            />
                                        </List.Item.Detail.Metadata>
                                    }
                                />
                            }
                            actions={
                                <ActionPanel>
                                    <Action
                                        title="Open in Discord"
                                        onAction={() =>
                                            handleOpenMessage(message)
                                        }
                                    />
                                    <Action
                                        title="Back to Channels"
                                        onAction={() => pop()}
                                    />
                                </ActionPanel>
                            }
                        />
                    ))
                )}
            </List.Section>
        </List>
    );
}

// Main component
export default function SearchMessages() {
    const [selectedChannel, setSelectedChannel] =
        useState<DiscordChannel | null>(null);
    const { push } = useNavigation();

    // Handle channel selection
    const handleChannelSelect = (channel: DiscordChannel) => {
        setSelectedChannel(channel);
        push(<MessageSearch channel={channel} />);
    };

    return <ChannelSelector onChannelSelect={handleChannelSelect} />;
}
