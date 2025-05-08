import { useState } from "react";
import {
    Action,
    ActionPanel,
    Form,
    Icon,
    showToast,
    Toast,
} from "@raycast/api";
import { setStatus } from "./api";

interface FormValues {
    status: string;
    customStatusText: string;
    customStatusEmoji: string;
}

export default function Command() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(values: FormValues) {
        setIsLoading(true);

        try {
            // Prepare status data for API
            const statusData = {
                status: values.status as
                    | "online"
                    | "idle"
                    | "dnd"
                    | "invisible",
                custom_status: {
                    text: values.customStatusText || undefined,
                    emoji_name: values.customStatusEmoji || undefined,
                },
            };

            await setStatus(statusData);

            showToast({
                style: Toast.Style.Success,
                title: "Status updated",
                message: "Your Discord status has been updated",
            });
        } catch (error) {
            console.error("Error updating status:", error);
            showToast({
                style: Toast.Style.Failure,
                title: "Failed to update status",
                message: String(error),
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form
            isLoading={isLoading}
            actions={
                <ActionPanel>
                    <Action.SubmitForm
                        title="Update Status"
                        onSubmit={handleSubmit}
                    />
                </ActionPanel>
            }
        >
            <Form.Dropdown id="status" title="Status" defaultValue="online">
                <Form.Dropdown.Item
                    value="online"
                    title="Online"
                    icon={{ source: Icon.Circle, tintColor: "#43b581" }}
                />
                <Form.Dropdown.Item
                    value="idle"
                    title="Idle"
                    icon={{ source: Icon.Circle, tintColor: "#faa61a" }}
                />
                <Form.Dropdown.Item
                    value="dnd"
                    title="Do Not Disturb"
                    icon={{ source: Icon.Circle, tintColor: "#f04747" }}
                />
                <Form.Dropdown.Item
                    value="invisible"
                    title="Invisible"
                    icon={{ source: Icon.Circle, tintColor: "#747f8d" }}
                />
            </Form.Dropdown>

            <Form.TextField
                id="customStatusText"
                title="Custom Status Text"
                placeholder="What's happening?"
            />

            <Form.TextField
                id="customStatusEmoji"
                title="Custom Status Emoji"
                placeholder="E.g. 😊 (optional)"
            />
        </Form>
    );
}
