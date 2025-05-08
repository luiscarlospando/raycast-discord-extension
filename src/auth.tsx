import { OAuth, showToast, Toast } from "@raycast/api";
import { config } from './config';
import { discordAPI } from './utils/api';
import { AuthenticationError } from './types/errors';
import { logger } from './utils/logger';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    scope: string;
    expires_in: number;
}


export const client = new OAuth.PKCEClient({
    redirectMethod: OAuth.RedirectMethod.Web,
    providerName: "Discord",
    providerIcon: "discord-icon.png",
    description: "Connect your Discord account",
});

export async function authorize(): Promise<string | null> {
    try {
        const existingTokens = await client.getTokens();
        if (existingTokens?.accessToken) {
            try {
                await discordAPI.getCurrentUser();
                return existingTokens.accessToken;
            } catch (error) {
                if (existingTokens.refreshToken) {
                    try {
                        const refreshedTokens = await refreshTokens(existingTokens.refreshToken);
                        discordAPI.setAccessToken(refreshedTokens.access_token);
                        return refreshedTokens.access_token;
                    } catch (refreshError) {
                        logger.error('Token refresh failed:', refreshError);
                        await handleAuthError(refreshError);
                    }
                }
            }
            await client.removeTokens();
        }

        return await performNewAuthorization();
    } catch (error) {
        await handleAuthError(error);
        return null;
    }
}

async function performNewAuthorization(): Promise<string> {
    const authRequest = await client.authorizationRequest({
        endpoint: `${config.api.baseUrl}${config.endpoints.auth}`,
        clientId: config.api.clientId,
        scope: config.api.scopes.join(' '),
        extraParameters: {
            response_type: "code",
            prompt: "consent",
            redirect_uri: "https://raycast.com/redirect?packageName=Extension"
        }
    });

    const { authorizationCode } = await client.authorize(authRequest);
    if (!authorizationCode) {
        throw new AuthenticationError("No authorization code received");
    }

    const newTokens = await exchangeCodeForTokens(authorizationCode, authRequest.codeVerifier);
    await client.setTokens(newTokens);
    discordAPI.setAccessToken(newTokens.access_token);
    return newTokens.access_token;
}

async function handleAuthError(error: unknown): Promise<void> {
    logger.error("Authentication error:", error);
    await client.removeTokens();
    
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    await showToast({
        style: Toast.Style.Failure,
        title: "Authentication Failed",
        message,
    });
    
    throw error;
}

async function exchangeCodeForTokens(
    authCode: string,
    codeVerifier: string
): Promise<TokenResponse> {
    try {
        const response = await fetch(`${config.api.baseUrl}${config.endpoints.token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: new URLSearchParams({
                client_id: config.api.clientId,
                client_secret: config.api.clientSecret,
                grant_type: "authorization_code",
                code: authCode,
                redirect_uri: config.api.redirectUri,
                code_verifier: codeVerifier,
            }),
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as { message?: string };
            throw new AuthenticationError(
                errorData.message || 'Failed to exchange code for tokens',
                { status: response.status, error: errorData }
            );
        }

        const data = await response.json() as TokenResponse;
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            scope: data.scope,
            expires_in: data.expires_in,
        };
    } catch (error) {
        logger.error('Token exchange failed:', error);
        throw error;
    }
}

export async function refreshTokens(
    refreshToken: string
): Promise<TokenResponse> {
    try {
        const response = await fetch(`${config.api.baseUrl}${config.endpoints.token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: new URLSearchParams({
                client_id: config.api.clientId,
                client_secret: config.api.clientSecret,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                redirect_uri: config.api.redirectUri,
            }),
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as { message?: string };
            throw new AuthenticationError(
                errorData.message || 'Failed to refresh tokens',
                { status: response.status, error: errorData }
            );
        }

        const data = await response.json() as TokenResponse;
        const newTokens = data;

        await client.setTokens(newTokens);
        discordAPI.setAccessToken(newTokens.access_token);
        return newTokens;
    } catch (error) {
        logger.error('Token refresh failed:', error);
        throw error;
    }
}

export async function logout(): Promise<void> {
    await client.removeTokens();
}
