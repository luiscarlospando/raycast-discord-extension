import { List, ActionPanel, Action } from "@raycast/api";
import { Message } from "../api";
import { formatTimestamp, getAvatarUrl } from "../utils";

interface MessageItemProps {
  message: Message;
  onMessageSelect: (message: Message) => void;
}

export function MessageItem({ message, onMessageSelect }: MessageItemProps) {
  return (
    <List.Item
      title={message.author.username}
      subtitle={message.content}
      icon={
        message.author.avatar
          ? { source: getAvatarUrl(message.author.id, message.author.avatar) }
          : { source: "user-icon.png" }
      }
      accessories={[{ text: formatTimestamp(message.timestamp) }]}
      actions={
        <ActionPanel>
          <Action title="Open in Discord" onAction={() => onMessageSelect(message)} />
        </ActionPanel>
      }
    />
  );
}
