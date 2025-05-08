import { useState, useEffect } from "react";
import { Action, ActionPanel, List, showToast, Toast } from "@raycast/api";
import {
    getServers,
    getChannels,
    searchMessages,
    Server,
    Channel,
    Message,
} from "./api";
import { formatTimestamp } from "./utils";

export default function Command() {
    const [isLoading, setIsLoading] = useState(true);
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServer, setSelectedServer] = useState<string | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [view, setView] = useState<"servers" | "channels" | "results">(
        "servers"
    );

    // Load servers when component mounts
    useEffect(() => {
        async function fetchServers() {
            try {
                const fetchedServers = await getServers();
                setServers(fetchedServers);
            } catch (error) {
                console.error("Error fetching servers:", error);
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load servers",
                    message: String(error),
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchServers();
    }, []);

    async function handleServerSelect(serverId: string) {
        setSelectedServer(serverId);
        setIsLoading(true);

        try {
            const fetchedChannels = await getChannels(serverId);
            // Filter to only text channels (type 0)
            setChannels(
                fetchedChannels.filter((channel) => channel.type === 0)
            );
            setView("channels");
        } catch (error) {
            console.error("Error fetching channels:", error);
            showToast({
                style: Toast.Style.Failure,
                title: "Failed to load channels",
                message: String(error),
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSearch(channelId: string, query: string) {
        if (!query.trim()) {
            showToast({
                style: Toast.Style.Failure,
                title: "Empty search query",
                message: "Please enter a search term",
            });
            return;
        }

        setSelectedChannel(channelId);
        setIsLoading(true);

        try {
            const results = await searchMessages(channelId, query);
            setSearchResults(results);
            setView("results");
        } catch (error) {
            console.error("Error searching messages:", error);
            showToast({
                style: Toast.Style.Failure,
                title: "Search failed",
                message: String(error),
            });
        } finally {
            setIsLoading(false);
        }
    }

    function openMessageInDiscord(message: Message) {
        const url = `discord://discord.com/channels/${selectedServer}/${message.channel_id}/${message.id}`;
        // Use Raycast's openInBrowser function to open this URL
    }

    function renderContent() {
        switch (view) {
            case "servers":
                return (
                    <>
                        <List.Section title="Select a Server">
                            {servers.map((server) => (
                                <List.Item
                                    key={server.id}
                                    title={server.name}
                                    actions={
                                        <ActionPanel>
                                            <Action
                                                title="Select Server"
                                                onAction={() =>
                                                    handleServerSelect(
                                                        server.id
                                                    )
                                                }
                                            />
                                        </ActionPanel>
                                    }
                                />
                            ))}
                        </List.Section>
                    </>
                );

            case "channels":
                return (
                    <>
                        <List.Section title="Select a Channel">
                            {channels.map((channel) => (
                                <List.Item
                                    key={channel.id}
                                    title={`#${channel.name}`}
                                    actions={
                                        <ActionPanel>
                                            <Action
                                                title="Search in This Channel"
                                                onAction={() =>
                                                    handleSearch(
                                                        channel.id,
                                                        searchQuery
                                                    )
                                                }
                                            />
                                            <Action
                                                title="Back to Servers"
                                                onAction={() =>
                                                    setView("servers")
                                                }
                                            />
                                        </ActionPanel>
                                    }
                                />
                            ))}
                        </List.Section>
                    </>
                );

            case "results":
                return (
                    <>
                        <List.Section title="Search Results">
                            {searchResults.length > 0 ? (
                                searchResults.map((message) => (
                                    <List.Item
                                        key={message.id}
                                        title={message.author.username}
                                        subtitle={message.content}
                                        accessories={[
                                            {
                                                text: formatTimestamp(
                                                    message.timestamp
                                                ),
                                            },
                                        ]}
                                        actions={
                                            <ActionPanel>
                                                <Action
                                                    title="Open in Discord"
                                                    onAction={() =>
                                                        openMessageInDiscord(
                                                            message
                                                        )
                                                    }
                                                />
                                                <Action
                                                    title="New Search"
                                                    onAction={() =>
                                                        setView("channels")
                                                    }
                                                />
                                                <Action
                                                    title="Back to Servers"
                                                    onAction={() =>
                                                        setView("servers")
                                                    }
                                                />
                                            </ActionPanel>
                                        }
                                    />
                                ))
                            ) : (
                                <List.Item
                                    title="No results found"
                                    actions={
                                        <ActionPanel>
                                            <Action
                                                title="New Search"
                                                onAction={() =>
                                                    setView("channels")
                                                }
                                            />
                                            <Action
                                                title="Back to Servers"
                                                onAction={() =>
                                                    setView("servers")
                                                }
                                            />
                                        </ActionPanel>
                                    }
                                />
                            )}
                        </List.Section>
                    </>
                );
        }
    }

    return (
        <List
            isLoading={isLoading}
            searchBarPlaceholder="Search messages..."
            onSearchTextChange={setSearchQuery}
            searchBarAccessory={
                view !== "servers" ? (
                    <List.Dropdown
                        tooltip="Navigate"
                        onChange={(newValue) => {
                            if (newValue === "servers") setView("servers");
                            else if (newValue === "channels")
                                setView("channels");
                        }}
                    >
                        <List.Dropdown.Item title="Servers" value="servers" />
                        {view !== "servers" && (
                            <List.Dropdown.Item
                                title="Channels"
                                value="channels"
                            />
                        )}
                    </List.Dropdown>
                ) : null
            }
        >
            {renderContent()}
        </List>
    );
}
