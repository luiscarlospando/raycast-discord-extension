import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import fetch from 'node-fetch';
import { discordAPI } from '../utils/api';
import { config } from '../config';
import {
    AuthenticationError,
    DiscordError,
    NetworkError,
    ServerError,
    ValidationError
} from '../types/errors';
import { DiscordUser, DiscordGuild, DiscordChannel, DiscordMessage } from '../types/discord';

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('DiscordAPI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        discordAPI.clearCache();
    });

    describe('Authentication', () => {
        it('should throw AuthenticationError when no access token is set', async () => {
            await expect(discordAPI.getCurrentUser()).rejects.toThrow(AuthenticationError);
        });

        it('should set access token correctly', () => {
            const token = 'test-token';
            discordAPI.setAccessToken(token);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('User Endpoints', () => {
        beforeEach(() => {
            discordAPI.setAccessToken('test-token');
        });

        it('should fetch current user', async () => {
            const mockUser: DiscordUser = {
                id: '123',
                username: 'testuser',
                discriminator: '1234',
                avatar: null
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockUser),
                headers: new Map()
            } as any);

            const user = await discordAPI.getCurrentUser();
            expect(user).toEqual(mockUser);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should use cached user data', async () => {
            const mockUser: DiscordUser = {
                id: '123',
                username: 'testuser',
                discriminator: '1234',
                avatar: null
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockUser),
                headers: new Map()
            } as any);

            await discordAPI.getCurrentUser();
            const cachedUser = await discordAPI.getCurrentUser();
            
            expect(cachedUser).toEqual(mockUser);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Guild Endpoints', () => {
        beforeEach(() => {
            discordAPI.setAccessToken('test-token');
        });

        it('should fetch guilds', async () => {
            const mockGuilds: DiscordGuild[] = [{
                id: '123',
                name: 'Test Guild',
                icon: null,
                features: []
            }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockGuilds),
                headers: new Map()
            } as any);

            const guilds = await discordAPI.getGuilds();
            expect(guilds).toEqual(mockGuilds);
        });

        it('should fetch guild channels', async () => {
            const mockChannels: DiscordChannel[] = [{
                id: '123',
                type: 0,
                name: 'test-channel'
            }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockChannels),
                headers: new Map()
            } as any);

            const channels = await discordAPI.getGuildChannels('123');
            expect(channels).toEqual(mockChannels);
        });
    });

    describe('Message Endpoints', () => {
        beforeEach(() => {
            discordAPI.setAccessToken('test-token');
        });

        it('should fetch channel messages', async () => {
            const mockMessages: DiscordMessage[] = [{
                id: '123',
                channel_id: '456',
                author: {
                    id: '789',
                    username: 'testuser',
                    discriminator: '1234',
                    avatar: null
                },
                content: 'test message',
                timestamp: new Date().toISOString(),
                edited_timestamp: null,
                tts: false,
                mention_everyone: false,
                mentions: [],
                mention_roles: [],
                attachments: [],
                embeds: [],
                type: 0
            }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockMessages),
                headers: new Map()
            } as any);

            const messages = await discordAPI.getChannelMessages('456');
            expect(messages).toEqual(mockMessages);
        });

        it('should search messages', async () => {
            const mockMessages: DiscordMessage[] = [{
                id: '123',
                channel_id: '456',
                author: {
                    id: '789',
                    username: 'testuser',
                    discriminator: '1234',
                    avatar: null
                },
                content: 'test message',
                timestamp: new Date().toISOString(),
                edited_timestamp: null,
                tts: false,
                mention_everyone: false,
                mentions: [],
                mention_roles: [],
                attachments: [],
                embeds: [],
                type: 0
            }];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve(mockMessages),
                headers: new Map()
            } as any);

            const messages = await discordAPI.searchMessages('123', 'test');
            expect(messages).toEqual(mockMessages);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            discordAPI.setAccessToken('test-token');
        });

        it('should handle rate limiting', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: () => Promise.resolve({ retry_after: 5 }),
                headers: new Map([['Retry-After', '5']])
            } as any);

            await expect(discordAPI.getCurrentUser()).rejects.toThrow(DiscordError);
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('network error'));

            await expect(discordAPI.getCurrentUser()).rejects.toThrow(Error);
        });

        it('should handle validation errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ message: 'Invalid request' }),
                headers: new Map()
            } as any);

            await expect(discordAPI.getCurrentUser()).rejects.toThrow(ValidationError);
        });

        it('should handle server errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ message: 'Server error' }),
                headers: new Map()
            } as any);

            await expect(discordAPI.getCurrentUser()).rejects.toThrow(ServerError);
        });
    });
});