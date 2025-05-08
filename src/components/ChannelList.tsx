import { List, ActionPanel, Action } from "@raycast/api";
import { Channel } from "../api";

interface ChannelListProps {
  channels: Channel[];
  isLoading: boolean;
  onChannelSelect: (channelId: string) => void;
  onBackToServers: () => void;
}

export function ChannelList({ channels, isLoading, onChannelSelect, onBackToServers }: ChannelListProps) {
  // Filter to only show text channels (type 0)
  const textChannels = channels.filter(channel => channel.type === 0);

  return (
    <List isLoading={isLoading} navigationTitle="Select a Discord Channel">
      {textChannels.map((channel) => (
        <List.Item
          key={channel.id}
          title={`#${channel.name}`}
          icon={{ source: "channel-icon.png" }}
          actions={
            <ActionPanel>
              <Action title="Select Channel" onAction={() => onChannelSelect(channel.id)} />
              <Action title="Back to Servers" onAction={onBackToServers} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
