import { Detail, ActionPanel, Action, Icon, useNavigation } from "@raycast/api";
import { authorize, client } from "./auth";
import { getCurrentUser } from "./api";
import { useEffect, useState } from "react";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any | null;
  error: Error | null;
}

export default function TestAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const tokens = await client.getTokens();
      if (tokens?.accessToken) {
        const userData = await getCurrentUser();
        setState({
          isLoading: false,
          isAuthenticated: true,
          user: userData,
          error: null,
        });
      } else {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: null,
        });
      }
    } catch (error) {
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error : new Error("Failed to check auth status"),
      });
    }
  }

  async function handleLogin() {
    setState({ ...state, isLoading: true, error: null });
    try {
      await authorize();
      await checkAuthStatus();
    } catch (error) {
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: error instanceof Error ? error : new Error("Failed to login"),
      });
    }
  }

  async function handleLogout() {
    setState({ ...state, isLoading: true, error: null });
    try {
      await client.removeTokens();
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      });
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Failed to logout"),
      });
    }
  }

  if (state.isLoading) {
    return <Detail markdown="Loading..." />;
  }

  if (state.error) {
    return (
      <Detail
        markdown={`# Error\n\n${state.error.message}`}
        actions={
          <ActionPanel>
            <Action title="Try Again" onAction={checkAuthStatus} icon={Icon.ArrowClockwise} />
          </ActionPanel>
        }
      />
    );
  }

  if (!state.isAuthenticated) {
    return (
      <Detail
        markdown={`# Discord Login Required

Please click the "Login with Discord" button below to connect your Discord account.

This will open Discord in your browser where you can securely authorize access to this extension.`}
        actions={
          <ActionPanel>
            <Action title="Login with Discord" onAction={handleLogin} icon={Icon.Link} />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Detail
      markdown={`# Connected to Discord

Successfully connected as **${state.user.username}**${state.user.discriminator ? `#${state.user.discriminator}` : ""}

${state.user.avatar ? `![Avatar](https://cdn.discordapp.com/avatars/${state.user.id}/${state.user.avatar}.png?size=128)` : ""}

## Account Details
- **User ID:** ${state.user.id}
- **Email:** ${state.user.email || "Not available"}
- **Verified:** ${state.user.verified ? "Yes" : "No"}
`}
      actions={
        <ActionPanel>
          <Action title="Refresh" onAction={checkAuthStatus} icon={Icon.ArrowClockwise} />
          <Action title="Logout" onAction={handleLogout} icon={Icon.ExitFullScreen} />
        </ActionPanel>
      }
    />
  );
}