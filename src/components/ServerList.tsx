import { List } from "@raycast/api";
import { Server } from "../api";
import { getServerIconUrl } from "../utils";

interface ServerListProps {
  servers: Server[];
  isLoading: boolean;
  onServerSelect: (serverId: string) => void;
}

export function ServerList({ servers, isLoading, onServerSelect }: ServerListProps) {
  return (
    <List isLoading={isLoading} navigationTitle="Select a Discord Server">
      {servers.map((server) => (
        <List.Item
          key={server.id}
          title={server.name}
          icon={
            server.icon
              ? { source: getServerIconUrl(server.id, server.icon) }
              : { source: "discord-icon.png" }
          }
          actions={
            <ActionPanel>
              <Action title="Select Server" onAction={() => onServerSelect(server.id)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
