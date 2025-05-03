import { useState, useEffect } from "react";
import {
    List,
    ActionPanel,
    Action,
    showToast,
    Toast,
    Icon,
    Form,
    useNavigation,
} from "@raycast/api";
import { DiscordStatus, DiscordCustomStatus } from "./utils/types";
import {
    updateStatus,
    updateCustomStatus,
    checkLoggedIn,
} from "./utils/discord-api";

// Status options with descriptions and icons
const statusOptions: {
    value: DiscordStatus;
    title: string;
    description: string;
    icon: Icon;
    color: string;
}[] = [
    {
        value: "online",
        title: "Online",
        description: "You're online and ready to receive messages",
        icon: Icon.CircleFilled,
        color: "green",
    },
    {
        value: "idle",
        title: "Idle",
        description: "You're away from your computer",
        icon: Icon.Moon,
        color: "yellow",
    },
    {
        value: "dnd",
        title: "Do Not Disturb",
        description: "You're busy and won't receive notifications",
        icon: Icon.Minus,
        color: "red",
    },
    {
        value: "invisible",
        title: "Invisible",
        description: "You'll appear offline but still receive notifications",
        icon: Icon.EyeDisabled,
        color: "gray",
    },
];

// Custom status form
function CustomStatusForm() {
    const { pop } = useNavigation();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Handle form submission
    const handleSubmit = async (values: {
        text: string;
        emoji: string;
        duration: string;
    }) => {
        setIsSubmitting(true);

        try {
            // Calculate expiration date based on duration
            let expiresAt: Date | undefined;

            if (values.duration !== "never") {
                expiresAt = new Date();

                switch (values.duration) {
                    case "1h":
                        expiresAt.setHours(expiresAt.getHours() + 1);
                        break;
                    case "4h":
                        expiresAt.setHours(expiresAt.getHours() + 4);
                        break;
                    case "1d":
                        expiresAt.setDate(expiresAt.getDate() + 1);
                        break;
                    case "7d":
                        expiresAt.setDate(expiresAt.getDate() + 7);
                        break;
                }
            }

            // Update custom status
            await updateCustomStatus({
                text: values.text,
                emoji: values.emoji || undefined,
                expiresAt,
            });

            showToast({
                style: Toast.Style.Success,
                title: "Custom Status Updated",
            });

            // Go back to previous screen
            pop();
        } catch (error) {
            showToast({
                style: Toast.Style.Failure,
                title: "Failed to Update Custom Status",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form
            navigationTitle="Set Custom Status"
            isLoading={isSubmitting}
            actions={
                <ActionPanel>
                    <Action.SubmitForm
                        title="Set Custom Status"
                        onSubmit={handleSubmit}
                    />
                </ActionPanel>
            }
        >
            <Form.TextField
                id="text"
                title="Status Text"
                placeholder="What's happening?"
            />
            <Form.TextField
                id="emoji"
                title="Emoji"
                placeholder="E.g. 👨‍💻 or :computer:"
            />
            <Form.Dropdown id="duration" title="Duration" defaultValue="never">
                <Form.Dropdown.Item
                    value="never"
                    title="Don't Clear"
                    icon={Icon.Infinity}
                />
                <Form.Dropdown.Item
                    value="1h"
                    title="1 hour"
                    icon={Icon.Clock}
                />
                <Form.Dropdown.Item
                    value="4h"
                    title="4 hours"
                    icon={Icon.Clock}
                />
                <Form.Dropdown.Item
                    value="1d"
                    title="1 day"
                    icon={Icon.Calendar}
                />
                <Form.Dropdown.Item
                    value="7d"
                    title="1 week"
                    icon={Icon.Calendar}
                />
            </Form.Dropdown>
        </Form>
    );
}

// Main status component
export default function SetStatus() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { push } = useNavigation();

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

    // Handle status selection
    const handleSelectStatus = async (status: DiscordStatus) => {
        setIsLoading(true);

        try {
            await updateStatus(status);

            showToast({
                style: Toast.Style.Success,
                title: "Status Updated",
                message: `Discord status set to ${status}`,
            });
        } catch (error) {
            showToast({
                style: Toast.Style.Failure,
                title: "Failed to Update Status",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle custom status
    const handleCustomStatus = () => {
        push(<CustomStatusForm />);
    };

    // Common action for clearing custom status
    const clearCustomStatusAction = (
        <Action
            title="Clear Custom Status"
            onAction={async () => {
                try {
                    await updateCustomStatus({ text: "" });
                    showToast({
                        style: Toast.Style.Success,
                        title: "Custom Status Cleared",
                    });
                } catch (error) {
                    showToast({
                        style: Toast.Style.Failure,
                        title: "Failed to Clear Custom Status",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Unknown error occurred",
                    });
                }
            }}
        />
    );

    return (
        <List
            isLoading={isLoading}
            navigationTitle="Set Discord Status"
            searchBarPlaceholder="Filter status options..."
        >
            {!isLoggedIn ? (
                <List.EmptyView
                    title="Not Logged In"
                    description="Please set your Discord token in Raycast preferences"
                    icon={Icon.PersonDisabled}
                />
            ) : (
                <>
                    <List.Section title="Presence Status">
                        {statusOptions.map((status) => (
                            <List.Item
                                key={status.value}
                                icon={{
                                    source: status.icon,
                                    tintColor: status.color,
                                }}
                                title={status.title}
                                subtitle={status.description}
                                actions={
                                    <ActionPanel>
                                        <Action
                                            title={`Set Status to ${status.title}`}
                                            onAction={() =>
                                                handleSelectStatus(status.value)
                                            }
                                        />
                                        {clearCustomStatusAction}
                                    </ActionPanel>
                                }
                            />
                        ))}
                    </List.Section>

                    <List.Section title="Custom Status">
                        <List.Item
                            icon={Icon.Text}
                            title="Set Custom Status"
                            subtitle="Add a custom message to your profile"
                            actions={
                                <ActionPanel>
                                    <Action
                                        title="Set Custom Status"
                                        onAction={handleCustomStatus}
                                    />
                                    {clearCustomStatusAction}
                                </ActionPanel>
                            }
                        />

                        <List.Item
                            icon={Icon.XmarkCircle}
                            title="Clear Custom Status"
                            subtitle="Remove your custom status message"
                            actions={
                                <ActionPanel>
                                    {clearCustomStatusAction}
                                </ActionPanel>
                            }
                        />
                    </List.Section>

                    <List.Section title="Quick Presets">
                        <List.Item
                            icon={{
                                source: Icon.Briefcase,
                                tintColor: "brown",
                            }}
                            title="Working"
                            subtitle="Set status to 'Do Not Disturb' with 'Working' message"
                            actions={
                                <ActionPanel>
                                    <Action
                                        title="Set 'Working' Status"
                                        onAction={async () => {
                                            try {
                                                await updateStatus("dnd");
                                                await updateCustomStatus({
                                                    text: "Working",
                                                    emoji: "💼",
                                                });
                                                showToast({
                                                    style: Toast.Style.Success,
                                                    title: "Status Updated",
                                                    message:
                                                        "Set to 'Do Not Disturb' with 'Working' message",
                                                });
                                            } catch (error) {
                                                showToast({
                                                    style: Toast.Style.Failure,
                                                    title: "Failed to Update Status",
                                                    message:
                                                        error instanceof Error
                                                            ? error.message
                                                            : "Unknown error occurred",
                                                });
                                            }
                                        }}
                                    />
                                </ActionPanel>
                            }
                        />

                        <List.Item
                            icon={{
                                source: Icon.VideoCamera,
                                tintColor: "red",
                            }}
                            title="In a Meeting"
                            subtitle="Set status to 'Do Not Disturb' with 'In a meeting' message"
                            actions={
                                <ActionPanel>
                                    <Action
                                        title="Set 'In a Meeting' Status"
                                        onAction={async () => {
                                            try {
                                                await updateStatus("dnd");
                                                await updateCustomStatus({
                                                    text: "In a meeting",
                                                    emoji: "🎥",
                                                });
                                                showToast({
                                                    style: Toast.Style.Success,
                                                    title: "Status Updated",
                                                    message:
                                                        "Set to 'Do Not Disturb' with 'In a meeting' message",
                                                });
                                            } catch (error) {
                                                showToast({
                                                    style: Toast.Style.Failure,
                                                    title: "Failed to Update Status",
                                                    message:
                                                        error instanceof Error
                                                            ? error.message
                                                            : "Unknown error occurred",
                                                });
                                            }
                                        }}
                                    />
                                </ActionPanel>
                            }
                        />

                        <List.Item
                            icon={{
                                source: Icon.Checkmark,
                                tintColor: "green",
                            }}
                            title="Available"
                            subtitle="Set status to 'Online' and clear custom message"
                            actions={
                                <ActionPanel>
                                    <Action
                                        title="Set 'Available' Status"
                                        onAction={async () => {
                                            try {
                                                await updateStatus("online");
                                                await updateCustomStatus({
                                                    text: "",
                                                });
                                                showToast({
                                                    style: Toast.Style.Success,
                                                    title: "Status Updated",
                                                    message:
                                                        "Set to 'Online' with no custom message",
                                                });
                                            } catch (error) {
                                                showToast({
                                                    style: Toast.Style.Failure,
                                                    title: "Failed to Update Status",
                                                    message:
                                                        error instanceof Error
                                                            ? error.message
                                                            : "Unknown error occurred",
                                                });
                                            }
                                        }}
                                    />
                                </ActionPanel>
                            }
                        />
                    </List.Section>
                </>
            )}
        </List>
    );
}
