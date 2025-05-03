import { getPreferenceValues, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { checkLoggedIn } from "./utils/discord-api";

interface Preferences {
    discordToken: string;
}

export default function DiscordController() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    // Check Discord login status on component mount
    useEffect(() => {
        const validateLogin = async () => {
            const loggedIn = await checkLoggedIn();
            setIsLoggedIn(loggedIn);
        };

        validateLogin();
    }, []);

    // Get preferences
    const preferences = getPreferenceValues<Preferences>();
    const hasToken = !!preferences.discordToken;

    // List of available commands
    const commands = [
        {
            name: "openChannels",
            title: "Open Discord Channels",
            description: "Browse and open Discord servers and channels",
            icon: Icon.Hash,
            requiresLogin: true,
        },
        {
            name: "searchMessages",
            title: "Search Discord Messages",
            description: "Search messages within Discord channels",
            icon: Icon.MagnifyingGlass,
            requiresLogin: true,
        },
        {
            name: "unreadMessages",
            title: "View Unread Messages",
            description: "List and access unread Discord messages",
            icon: Icon.Envelope,
            requiresLogin: true,
        },
        {
            name: "toggleNotifications",
            title: "Toggle Discord Notifications",
            description: "Enable or disable Discord notifications",
            icon: Icon.Bell,
            requiresLogin: true,
        },
        {
            name: "setStatus",
            title: "Set Discord Status",
            description:
                "Change your Discord presence status and add custom messages",
            icon: Icon.UserCircle,
            requiresLogin: true,
        },
    ];

    return (
        <List
            navigationTitle="Discord Controller"
            searchBarPlaceholder="Search Discord commands..."
        >
            <List.Section title="Discord Commands">
                {commands.map((command) => (
                    <List.Item
                        key={command.name}
                        icon={command.icon}
                        title={command.title}
                        subtitle={command.description}
                        accessories={[
                            {
                                icon:
                                    isLoggedIn === null
                                        ? Icon.Loading
                                        : isLoggedIn
                                          ? Icon.CheckCircle
                                          : Icon.XmarkCircle,
                                tooltip:
                                    isLoggedIn === null
                                        ? "Checking login status..."
                                        : isLoggedIn
                                          ? "Logged in to Discord"
                                          : "Not logged in to Discord",
                            },
                        ]}
                        actions={
                            <List.Item.Action.Push
                                title={
                                    command.requiresLogin && !isLoggedIn
                                        ? "Login Required"
                                        : command.title
                                }
                                target={
                                    command.requiresLogin && !isLoggedIn ? (
                                        <LoginRequiredView />
                                    ) : (
                                        {
                                            openChannels:
                                                require("./open-channels")
                                                    .default,
                                            searchMessages:
                                                require("./search-messages")
                                                    .default,
                                            unreadMessages:
                                                require("./unread-messages")
                                                    .default,
                                            toggleNotifications:
                                                require("./toggle-notifications")
                                                    .default,
                                            setStatus:
                                                require("./set-status").default,
                                        }[command.name]
                                    )
                                }
                            />
                        }
                    />
                ))}
            </List.Section>
        </List>
    );
}

// View for when login is required
function LoginRequiredView() {
    return (
        <List>
            <List.EmptyView
                title="Discord Login Required"
                description="Please set your Discord token in Raycast preferences to use this feature."
                icon={Icon.Person}
            />
        </List>
    );
}
