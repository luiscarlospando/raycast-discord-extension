import {
    OAuth2AuthorizationResult,
    getPreferenceValues,
    oauthRequest,
} from "@raycast/api";
import * as oauth from "oauth4webapi";

// Interface for preferences
interface Preferences {
    clientId: string;
    clientSecret: string;
}

// Constants for Discord authentication
const DISCORD_AUTH_ENDPOINT = "https://discord.com/api/oauth2/authorize";
const DISCORD_TOKEN_ENDPOINT = "https://discord.com/api/oauth2/token";
const REDIRECT_URI = "https://raycast.com/redirect";

// Scopes needed for Discord access
const SCOPES = [
    "identify", // Basic user information
    "guilds", // Server list
    "guilds.members.read", // Server member info
    "messages.read", // Read messages
    "rpc", // For Discord remote control
    "rpc.notifications.read", // Read notifications
    "rpc.voice.write", // Voice control
];

// Function to initiate OAuth authentication flow
export async function authorize() {
    const preferences = getPreferenceValues<Preferences>();

    // Create OAuth client
    const client: oauth.Client = {
        client_id: preferences.clientId,
        client_secret: preferences.clientSecret,
        token_endpoint_auth_method: "client_secret_basic",
    };

    // Start authorization request
    const authRequest = await oauthRequest({
        endpoint: DISCORD_AUTH_ENDPOINT,
        clientId: preferences.clientId,
        scope: SCOPES.join(" "),
        responseType: "code",
    });

    return handleAuthorizationResponse(client, authRequest);
}

// Handle authorization response
async function handleAuthorizationResponse(
    client: oauth.Client,
    authorizationResponse: OAuth2AuthorizationResult
) {
    // Check if authorization was successful
    if (authorizationResponse.type !== "success") {
        throw new Error(
            "Authorization failed: " + authorizationResponse.message
        );
    }

    // Prepare token request
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", authorizationResponse.code);
    params.append("redirect_uri", REDIRECT_URI);

    const preferences = getPreferenceValues<Preferences>();

    // Request access token
    const response = await fetch(DISCORD_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${preferences.clientId}:${preferences.clientSecret}`).toString("base64")}`,
        },
        body: params.toString(),
    });

    // Process the response
    if (!response.ok) {
        throw new Error(
            `Error getting token: ${response.status} ${await response.text()}`
        );
    }

    const tokenResponse = await response.json();

    // Store tokens securely
    await storeTokens(tokenResponse);

    return tokenResponse;
}

// Store tokens securely
import { LocalStorage } from "@raycast/api";

async function storeTokens(tokens: any) {
    await LocalStorage.setItem("discord_tokens", JSON.stringify(tokens));
}

// Get stored tokens
export async function getStoredTokens() {
    const tokensString = await LocalStorage.getItem("discord_tokens");
    if (!tokensString) {
        return null;
    }
    return JSON.parse(tokensString as string);
}

// Check if user is authenticated
export async function isAuthenticated() {
    const tokens = await getStoredTokens();
    return tokens !== null;
}

// Function to make requests to Discord API with token
export async function fetchFromDiscord(
    endpoint: string,
    options: RequestInit = {}
) {
    const tokens = await getStoredTokens();

    if (!tokens) {
        throw new Error("You are not logged in. Please authenticate first.");
    }

    const response = await fetch(`https://discord.com/api/v10${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        // If token has expired, we could implement renewal here
        throw new Error(
            `Error in Discord request: ${response.status} ${await response.text()}`
        );
    }

    return response.json();
}

// Logout
export async function logout() {
    await LocalStorage.removeItem("discord_tokens");
}
