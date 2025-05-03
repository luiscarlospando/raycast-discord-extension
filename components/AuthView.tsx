import { Action, ActionPanel, Detail, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { authorize, isAuthenticated, logout } from "../oauth";

interface AuthViewProps {
    onAuthenticated: () => void;
}

export function AuthView({ onAuthenticated }: AuthViewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkAuthentication();
    }, []);

    async function checkAuthentication() {
        try {
            const authenticated = await isAuthenticated();
            setIsLoggedIn(authenticated);
            if (authenticated) {
                onAuthenticated();
            }
        } catch (error) {
            console.error("Error checking authentication:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLogin() {
        try {
            setIsLoading(true);
            await showToast({
                style: Toast.Style.Animated,
                title: "Starting authentication process",
            });

            await authorize();

            await showToast({
                style: Toast.Style.Success,
                title: "Authentication successful!",
            });

            setIsLoggedIn(true);
            onAuthenticated();
        } catch (error) {
            console.error("Authentication error:", error);

            await showToast({
                style: Toast.Style.Failure,
                title: "Authentication error",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLogout() {
        try {
            setIsLoading(true);
            await logout();
            setIsLoggedIn(false);

            await showToast({
                style: Toast.Style.Success,
                title: "Logged out successfully",
            });
        } catch (error) {
            console.error("Error logging out:", error);

            await showToast({
                style: Toast.Style.Failure,
                title: "Error logging out",
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const markdown = isLoggedIn
        ? `# You're connected to Discord\n\nYou can use all the extension's features.`
        : `# Connect to Discord\n\nYou need to log in with your Discord account to use this extension.\n\nClick the "Sign in with Discord" button in the action panel.`;

    return (
        <Detail
            markdown={markdown}
            isLoading={isLoading}
            actions={
                <ActionPanel>
                    {!isLoggedIn ? (
                        <Action
                            title="Sign in with Discord"
                            onAction={handleLogin}
                        />
                    ) : (
                        <Action title="Sign out" onAction={handleLogout} />
                    )}
                </ActionPanel>
            }
        />
    );
}
