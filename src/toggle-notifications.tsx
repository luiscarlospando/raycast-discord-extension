import { useState, useEffect } from "react";
import { Action, ActionPanel, Detail, showToast, Toast } from "@raycast/api";
import { toggleNotifications } from "./api";

export default function Command() {
    const [isLoading, setIsLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(true);

    useEffect(() => {
        // In a real implementation, you would fetch the current notification state
        // from Discord API. For this example, we'll assume notifications are on by default.
        setIsLoading(false);
    }, []);

    async function handleToggle(enabled: boolean) {
        setIsLoading(true);

        try {
            await toggleNotifications(enabled);
            setIsEnabled(enabled);

            showToast({
                style: Toast.Style.Success,
                title: enabled
                    ? "Notifications enabled"
                    : "Notifications disabled",
            });
        } catch (error) {
            console.error("Error toggling notifications:", error);
            showToast({
                style: Toast.Style.Failure,
                title: "Failed to toggle notifications",
                message: String(error),
            });
        } finally {
            setIsLoading(false);
        }
    }

    const markdown = `
  # Discord Notifications

  ${isEnabled ? "✅ Notifications are currently **enabled**" : "🔕 Notifications are currently **disabled**"}

  You'll ${isEnabled ? "receive" : "not receive"} notifications from Discord while using your computer.

  Use the actions below to change your notification settings.
  `;

    return (
        <Detail
            isLoading={isLoading}
            markdown={markdown}
            actions={
                <ActionPanel>
                    <Action
                        title={
                            isEnabled
                                ? "Disable Notifications"
                                : "Enable Notifications"
                        }
                        onAction={() => handleToggle(!isEnabled)}
                    />
                </ActionPanel>
            }
        />
    );
}
