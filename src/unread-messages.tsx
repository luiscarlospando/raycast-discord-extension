import { useEffect, useState } from "react";
import {
    Action,
    ActionPanel,
    List,
    Icon,
    showToast,
    Toast,
    Color,
} from "@raycast/api";
import { getServers, getUnreadMessages } from "./api";
import { getServerIconUrl } from "./utils";

interface UnreadMessage {
    id: string;
    content: string;
    author: {
        username: string;
        id: string;
        avatar: string;
    };
    timestamp: string;
    channel_id: string;
    guild_id: string;
}

interface UnreadChannel {
    id: string;
    name: string;
    guild_id: string;
    guild_name: string;
    mention_count: number;
    last_message_id: string;
    messages: UnreadMessage[];
}

export default function Command() {
    const [isLoading, setIsLoading] = useState(true);
    const [unreadChannels, setUnreadChannels] = useState<UnreadChannel[]>([]);
    const [serverMap, setServerMap] = useState<{
        [key: string]: { name: string; icon: string };
    }>({});

    useEffect(() => {
        async function fetchData() {
            try {
                // First fetch servers to get their names and icons
                const servers = await getServers();
                const serversMap = servers.reduce(
                    (acc, server) => {
                        acc[server.id] = {
                            name: server.name,
                            icon: server.icon,
                        };
                        return acc;
                    },
                    {} as { [key: string]: { name: string; icon: string } }
                );

                setServerMap(serversMap);

                // Then fetch unread messages
                const unreadData = await getUnreadMessages();

                // Process and organize the unread messages
                const processedChannels: UnreadChannel[] = [];

                // Process the response from Discord API
                // Note: This is a simplified example - actual processing will depend on the
                // exact structure of Discord's API response
                for (const channel of unreadData) {
                    if (channel.unread_count > 0) {
                        processedChannels.push({
                            id: channel.id,
                            name: channel.name || "Direct Message",
                            guild_id: channel.guild_id || "@me",
                            guild_name: channel.guild_id
                                ? serversMap[channel.guild_id]?.name ||
                                  "Unknown Server"
                                : "Direct Messages",
                            mention_count: channel.mention_count || 0,
                            last_message_id: channel.last_message_id,
                            messages: channel.messages || [],
                        });
                    }
                }

                setUnreadChannels(processedChannels);
            } catch (error) {
                console.error("Error fetching unread messages:", error);
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load unread messages",
                    message: String(error),
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    function openChannel(channelId: string, guildId: string) {
        const baseUrl = "discord://discord.com/channels/";
        const url =
            guildId === "@me"
                ? `${baseUrl}@me/${channelId}`
                : `${baseUrl}${guildId}/${channelId}`;
        // Use Raycast's openInBrowser function to open this URL
    }

    // Group unread channels by server for better organization
    const groupedChannels: { [key: string]: UnreadChannel[] } = {};
    unreadChannels.forEach((channel) => {
        if (!groupedChannels[channel.guild_id]) {
            groupedChannels[channel.guild_id] = [];
        }
        groupedChannels[channel.guild_id].push(channel);
    });

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Filter unread channels..."
        >
            {Object.entries(groupedChannels).map(([guildId, channels]) => (
                <List.Section
                    key={guildId}
                    title={channels[0].guild_name}
                    subtitle={`${channels.length} channel${channels.length !== 1 ? "s" : ""}`}
                >
                    {channels.map((channel) => {
                        const hasMentions = channel.mention_count > 0;

                        return (
                            <List.Item
                                key={channel.id}
                                title={channel.name}
                                subtitle={
                                    hasMentions
                                        ? `${channel.mention_count} mention${channel.mention_count !== 1 ? "s" : ""}`
                                        : "New messages"
                                }
                                icon={{
                                    source:
                                        guildId !== "@me" &&
                                        serverMap[guildId]?.icon
                                            ? getServerIconUrl(
                                                  guildId,
                                                  serverMap[guildId].icon
                                              )
                                            : Icon.Message,
                                }}
                                accessories={[
                                    hasMentions
                                        ? {
                                              icon: {
                                                  source: Icon.Pin,
                                                  tintColor: Color.Red,
                                              },
                                              tooltip: "Mentions",
                                          }
                                        : {
                                              icon: {
                                                  source: Icon.Circle,
                                                  tintColor: Color.Blue,
                                              },
                                              tooltip: "Unread",
                                          },
                                ]}
                                actions={
                                    <ActionPanel>
                                        <Action
                                            title="Open Channel"
                                            icon={Icon.ArrowRight}
                                            onAction={() =>
                                                openChannel(channel.id, guildId)
                                            }
                                        />
                                        <Action
                                            title={
                                                hasMentions
                                                    ? "Mark Mentions as Read"
                                                    : "Mark as Read"
                                            }
                                            icon={Icon.Check}
                                            onAction={() => {
                                                // Implement mark as read functionality
                                                showToast({
                                                    style: Toast.Style.Success,
                                                    title: "Marked as read",
                                                    message: `${channel.name} marked as read`,
                                                });
                                                // Update the UI by removing this channel
                                                setUnreadChannels(
                                                    unreadChannels.filter(
                                                        (c) =>
                                                            c.id !== channel.id
                                                    )
                                                );
                                            }}
                                        />
                                    </ActionPanel>
                                }
                            />
                        );
                    })}
                </List.Section>
            ))}

            {unreadChannels.length === 0 && !isLoading && (
                <List.EmptyView
                    icon={Icon.Checkmark}
                    title="All caught up!"
                    description="You have no unread messages"
                />
            )}
        </List>
    );
}
