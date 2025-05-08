import { ActionPanel, Action, List, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { getServers, getChannels, Server, Channel } from "./api";
import { getServerIconUrl } from "./utils";

export default function Command() {
    const [servers, setServers] = useState<Server[]>([]);
    const [channels, setChannels] = useState<{ [key: string]: Channel[] }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedServer, setSelectedServer] = useState<string | null>(null);

    useEffect(() => {
        async function fetchServers() {
            try {
                const fetchedServers = await getServers();
                setServers(fetchedServers);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching servers:", error);
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load servers",
                    message: String(error),
                });
                setIsLoading(false);
            }
        }

        fetchServers();
    }, []);

    async function handleServerSelect(serverId: string) {
        setSelectedServer(serverId);

        if (!channels[serverId]) {
            setIsLoading(true);
            try {
                const fetchedChannels = await getChannels(serverId);
                setChannels((prev) => ({
                    ...prev,
                    [serverId]: fetchedChannels,
                }));
            } catch (error) {
                console.error("Error fetching channels:", error);
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load channels",
                    message: String(error),
                });
            }
            setIsLoading(false);
        }
    }

    function openDiscordChannel(channelId: string) {
        const url = `discord://discord.com/channels/${selectedServer}/${channelId}`;
        // Use Raycast's openInBrowser function to open this URL
    }

    return (
        <List
            isLoading={isLoading}
            navigationTitle="Browse Discord Servers and Channels"
        >
            {!selectedServer
                ? // Server selection view
                  servers.map((server) => (
                      <List.Item
                          key={server.id}
                          title={server.name}
                          icon={
                              server.icon
                                  ? {
                                        source: getServerIconUrl(
                                            server.id,
                                            server.icon
                                        ),
                                    }
                                  : { source: "discord-icon.png" }
                          }
                          actions={
                              <ActionPanel>
                                  <Action
                                      title="Select Server"
                                      onAction={() =>
                                          handleServerSelect(server.id)
                                      }
                                  />
                              </ActionPanel>
                          }
                      />
                  ))
                : // Channel selection view
                  channels[selectedServer]?.map((channel) => {
                      // Only show text channels (type 0)
                      if (channel.type !== 0) return null;

                      return (
                          <List.Item
                              key={channel.id}
                              title={`#${channel.name}`}
                              icon={{ source: "channel-icon.png" }}
                              actions={
                                  <ActionPanel>
                                      <Action
                                          title="Open Channel"
                                          onAction={() =>
                                              openDiscordChannel(channel.id)
                                          }
                                      />
                                      <Action
                                          title="Back to Servers"
                                          onAction={() =>
                                              setSelectedServer(null)
                                          }
                                      />
                                  </ActionPanel>
                              }
                          />
                      );
                  })}
        </List>
    );
}
