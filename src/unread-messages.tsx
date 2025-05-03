import { useState, useEffect } from "react";
import {
    List,
    ActionPanel,
    Action,
    showToast,
    Toast,
    Icon,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { DiscordUnreadMessage } from "./utils/types";
import {
    getUnreadMessages,
    openDiscordChannel,
    checkLoggedIn,
} from "./utils/discord-api";
import { addRecentChannel } from "./utils/preferences";

export default function UnreadMessages() {
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

    // Fetch unread messages
    const {
        data: unreadMessages,
        isLoading,
        error,
        revalidate,
    } = useCachedPromise(
        async () => {
            if (!isLoggedIn) return [];
            return getUnreadMessages();
        },
        [isLoggedIn],
        {
            keepPreviousData: true,
            // Auto-refresh every 30 seconds
            initialPromise: () => Promise.resolve([]),
            refreshInterval: 30000,
        }
    );

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Open a channel and mark messages as read
    const handleOpenChannel = async (message: DiscordUnreadMessage) => {
        openDiscordChannel(message.channelId);
        await addRecentChannel(message.channelId);
        // Wait a bit then revalidate to refresh the list
        setTimeout(() => revalidate(), 2000);
    };

    // Group messages by channel
    const groupedMessages = unreadMessages?.reduce(
        (acc, message) => {
            const channelId = message.channelId;
            if (!acc[channelId]) {
                acc[channelId] = {
                    channelId,
                    channelName: message.channelName || "Unknown Channel",
                    serverId: message.serverId,
                    serverName: message.serverName || "Unknown Server",
                    messages: [],
                    mentionCount: 0,
                };
            }

            acc[channelId].messages.push(message);
            acc[channelId].mentionCount += message.mentionCount || 0;

            return acc;
        },
        {} as Record<
            string,
            {
                channelId: string;
                channelName: string;
                serverId: string;
                serverName: string;
                messages: DiscordUnreadMessage[];
                mentionCount: number;
            }
        >
    );

    // Convert grouped messages to array
    const channelsWithUnread = groupedMessages
        ? Object.values(groupedMessages)
        : [];

    // Handle errors
    if (error) {
        showToast({
            style: Toast.Style.Failure,
            title: "Failed to load unread messages",
            message: error.message,
        });
    }

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search unread messages..."
            navigationTitle="Unread Discord Messages"
            isShowingDetail
            onSelectionChange={() => {}}
            throttle
        >
            {!isLoggedIn ? (
                <List.EmptyView
                    title="Not Logged In"
                    description="Please set your Discord token in Raycast preferences"
                    icon={Icon.PersonDisabled}
                />
            ) : unreadMessages?.length === 0 ? (
                <List.EmptyView
                    title="No Unread Messages"
                    description="You're all caught up!"
                    icon={Icon.CheckCircle}
                />
            ) : (
                <List.Section
                    title="Unread Messages"
                    subtitle={channelsWithUnread.length.toString()}
                >
                    {channelsWithUnread.map((channel) => (
                        <List.Item
                            key={channel.channelId}
                            icon={
                                channel.mentionCount > 0
                                    ? Icon.ExclamationMark
                                    : Icon.Message
                            }
                            title={`#${channel.channelName}`}
                            subtitle={channel.serverName}
                            accessories={[
                                {
                                    text: `${channel.messages.length} messages`,
                                    icon: Icon.Message,
                                },
                                channel.mentionCount > 0
                                    ? {
                                          text: `${channel.mentionCount} mentions`,
                                          icon: Icon.AtSymbol,
                                      }
                                    : null,
                            ].filter(Boolean)}
                            detail={
                                <List.Item.Detail
                                    markdown={`# Unread in #${channel.channelName}\n\n**Server**: ${channel.serverName}\n\n**Unread Messages**: ${channel.messages.length}\n\n**Mentions**: ${channel.mentionCount}\n\n${channel.messages
                                        .map(
                                            (msg) =>
                                                `- **${msg.author.username}**: ${msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content} _(${formatDate(msg.timestamp)})_`
                                        )
                                        .join("\n\n")}`}
                                    metadata={
                                        <List.Item.Detail.Metadata>
                                            <List.Item.Detail.Metadata.Label
                                                title="Channel"
                                                text={`#${channel.channelName}`}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Server"
                                                text={channel.serverName}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Unread"
                                                text={channel.messages.length.toString()}
                                            />
                                            <List.Item.Detail.Metadata.Label
                                                title="Mentions"
                                                text={channel.mentionCount.toString()}
                                            />
                                            <List.Item.Detail.Metadata.Separator />
                                            <List.Item.Detail.Metadata.Label
                                                title="Latest Message"
                                                text={formatDate(
                                                    channel.messages[0]
                                                        .timestamp
                                                )}
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
                                            handleOpenChannel(
                                                channel.messages[0]
                                            )
                                        }
                                    />
                                    <Action
                                        title="Refresh"
                                        onAction={() => revalidate()}
                                    />
                                </ActionPanel>
                            }
                        />
                    ))}
                </List.Section>
            )}
        </List>
    );
}
