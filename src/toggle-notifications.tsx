import { useState, useEffect } from "react";
import {
    List,
    ActionPanel,
    Action,
    showToast,
    Toast,
    Icon,
} from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { DiscordNotificationSettings } from "./utils/types";
import {
    getNotificationSettings,
    updateNotificationSettings,
    checkLoggedIn,
} from "./utils/discord-api";

export default function ToggleNotifications() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [settings, setSettings] =
        useState<DiscordNotificationSettings | null>(null);
    const [error, setError] = useState<Error | null>(null);

    // Check login status and load notification settings
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);

            try {
                const loggedIn = await checkLoggedIn();
                setIsLoggedIn(loggedIn);

                if (!loggedIn) {
                    showToast({
                        style: Toast.Style.Failure,
                        title: "Not Logged In",
                        message: "Please set your Discord token in preferences",
                    });
                    setIsLoading(false);
                    return;
                }

                const notificationSettings = await getNotificationSettings();
                setSettings(notificationSettings);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Unknown error occurred")
                );
                showToast({
                    style: Toast.Style.Failure,
                    title: "Failed to load notification settings",
                    message:
                        err instanceof Error
                            ? err.message
                            : "Unknown error occurred",
                });
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    // Update notification settings
    const updateSettings = async (
        newSettings: Partial<DiscordNotificationSettings>
    ) => {
        if (!settings) return;

        setIsLoading(true);

        try {
            const updatedSettings = await updateNotificationSettings({
                ...settings,
                ...newSettings,
            });

            setSettings(updatedSettings);

            showToast({
                style: Toast.Style.Success,
                title: "Settings Updated",
                message: "Discord notification settings updated successfully",
            });
        } catch (err) {
            setError(
                err instanceof Error ? err : new Error("Unknown error occurred")
            );
            showToast({
                style: Toast.Style.Failure,
                title: "Failed to update settings",
                message:
                    err instanceof Error
                        ? err.message
                        : "Unknown error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle all notifications
    const toggleAllNotifications = async () => {
        if (!settings) return;
        await updateSettings({ enabled: !settings.enabled });
    };

    // Toggle desktop notifications
    const toggleDesktopNotifications = async () => {
        if (!settings) return;
        await updateSettings({ desktopEnabled: !settings.desktopEnabled });
    };

    // Toggle sound notifications
    const toggleSoundNotifications = async () => {
        if (!settings) return;
        await updateSettings({ soundEnabled: !settings.soundEnabled });
    };

    return (
        <List
            isLoading={isLoading}
            navigationTitle="Discord Notifications"
            searchBarPlaceholder="Filter notification settings..."
        >
            {!isLoggedIn ? (
                <List.EmptyView
                    title="Not Logged In"
                    description="Please set your Discord token in Raycast preferences"
                    icon={Icon.PersonDisabled}
                />
            ) : error ? (
                <List.EmptyView
                    title="Error Loading Settings"
                    description={error.message}
                    icon={Icon.Warning}
                />
            ) : settings ? (
                <>
                    <List.Section title="Notification Settings">
                        <List.Item
                            icon={
                                settings.enabled
                                    ? Icon.BellFilled
                                    : Icon.BellDisabled
                            }
                            title="All Notifications"
                            subtitle={settings.enabled ? "Enabled" : "Disabled"}
                            accessories={[
                                {
                                    icon: settings.enabled
                                        ? Icon.CircleFilled
                                        : Icon.Circle,
                                    tooltip: settings.enabled
                                        ? "Enabled"
                                        : "Disabled",
                                },
                            ]}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title={
                                            settings.enabled
                                                ? "Disable All Notifications"
                                                : "Enable All Notifications"
                                        }
                                        onAction={toggleAllNotifications}
                                    />
                                </ActionPanel>
                            }
                        />

                        <List.Item
                            icon={
                                settings.desktopEnabled
                                    ? Icon.Desktop
                                    : Icon.DesktopDisabled
                            }
                            title="Desktop Notifications"
                            subtitle={
                                settings.desktopEnabled ? "Enabled" : "Disabled"
                            }
                            accessories={[
                                {
                                    icon: settings.desktopEnabled
                                        ? Icon.CircleFilled
                                        : Icon.Circle,
                                    tooltip: settings.desktopEnabled
                                        ? "Enabled"
                                        : "Disabled",
                                },
                            ]}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title={
                                            settings.desktopEnabled
                                                ? "Disable Desktop Notifications"
                                                : "Enable Desktop Notifications"
                                        }
                                        onAction={toggleDesktopNotifications}
                                    />
                                </ActionPanel>
                            }
                        />

                        <List.Item
                            icon={
                                settings.soundEnabled
                                    ? Icon.Speaker
                                    : Icon.SpeakerMuted
                            }
                            title="Sound Notifications"
                            subtitle={
                                settings.soundEnabled ? "Enabled" : "Disabled"
                            }
                            accessories={[
                                {
                                    icon: settings.soundEnabled
                                        ? Icon.CircleFilled
                                        : Icon.Circle,
                                    tooltip: settings.soundEnabled
                                        ? "Enabled"
                                        : "Disabled",
                                },
                            ]}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title={
                                            settings.soundEnabled
                                                ? "Disable Sound Notifications"
                                                : "Enable Sound Notifications"
                                        }
                                        onAction={toggleSoundNotifications}
                                    />
                                </ActionPanel>
                            }
                        />

                        <List.Item
                            icon={
                                settings.mentionsOnly
                                    ? Icon.AtSymbol
                                    : Icon.Message
                            }
                            title="Mentions Only"
                            subtitle={
                                settings.mentionsOnly
                                    ? "Enabled"
                                    : "All Messages"
                            }
                            accessories={[
                                {
                                    icon: settings.mentionsOnly
                                        ? Icon.CircleFilled
                                        : Icon.Circle,
                                    tooltip: settings.mentionsOnly
                                        ? "Enabled"
                                        : "Disabled",
                                },
                            ]}
                            actions={
                                <ActionPanel>
                                    <Action
                                        title={
                                            settings.mentionsOnly
                                                ? "Notify For All Messages"
                                                : "Notify For Mentions Only"
                                        }
                                        onAction={() =>
                                            updateSettings({
                                                mentionsOnly:
                                                    !settings.mentionsOnly,
                                            })
                                        }
                                    />
                                </ActionPanel>
                            }
                        />
                    </List.Section>

                    <List.Section title="Quick Actions">
                        <List.Item
                            icon={Icon.Megaphone}
                            title={
                                settings.enabled
                                    ? "Mute Discord"
                                    : "Unmute Discord"
                            }
                            actions={
                                <ActionPanel>
                                    <Action
                                        title={
                                            settings.enabled
                                                ? "Mute Discord"
                                                : "Unmute Discord"
                                        }
                                        onAction={toggleAllNotifications}
                                    />
                                </ActionPanel>
                            }
                        />
                    </List.Section>
                </>
            ) : (
                <List.EmptyView
                    title="Loading Settings"
                    description="Please wait..."
                    icon={Icon.Loading}
                />
            )}
        </List>
    );
}
