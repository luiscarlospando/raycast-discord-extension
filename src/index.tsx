import { ActionPanel, Icon, List, Action } from "@raycast/api";
import { authorize } from "./auth";

export default function Command() {
    return (
        <List>
            <List.Section title="Discord Controller">
                <List.Item
                    icon={{ source: Icon.Message }}
                    title="Open Discord Channel"
                    actions={
                        <ActionPanel>
                            <Action.Push
                                title="Open"
                                target={require("./open-channel").default}
                                icon={Icon.ArrowRight}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    icon={{ source: Icon.MagnifyingGlass }}
                    title="Search Messages"
                    actions={
                        <ActionPanel>
                            <Action.Push
                                title="Search"
                                target={require("./search-messages").default}
                                icon={Icon.ArrowRight}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    icon={{ source: Icon.Bubble }}
                    title="View Unread Messages"
                    actions={
                        <ActionPanel>
                            <Action.Push
                                title="View"
                                target={require("./unread-messages").default}
                                icon={Icon.ArrowRight}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    icon={{ source: Icon.Bell }}
                    title="Toggle Notifications"
                    actions={
                        <ActionPanel>
                            <Action.Push
                                title="Toggle"
                                target={
                                    require("./toggle-notifications").default
                                }
                                icon={Icon.ArrowRight}
                            />
                        </ActionPanel>
                    }
                />

                <List.Item
                    icon={{ source: Icon.Person }}
                    title="Set Discord Status"
                    actions={
                        <ActionPanel>
                            <Action.Push
                                title="Set"
                                target={require("./set-status").default}
                                icon={Icon.ArrowRight}
                            />
                        </ActionPanel>
                    }
                />
            </List.Section>

            <List.Section title="Account">
                <List.Item
                    icon={{ source: Icon.Key }}
                    title="Re-authenticate with Discord"
                    actions={
                        <ActionPanel>
                            <Action
                                title="Authenticate"
                                onAction={async () => {
                                    await authorize();
                                }}
                                icon={Icon.Key}
                            />
                        </ActionPanel>
                    }
                />
            </List.Section>
        </List>
    );
}
