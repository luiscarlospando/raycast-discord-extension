import { jest } from '@jest/globals';
import { environment } from '@raycast/api';

// Mock Raycast API
jest.mock('@raycast/api', () => ({
  environment: {
    isDevelopment: true,
  },
  OAuth: {
    PKCEClient: jest.fn().mockImplementation(() => ({
      getTokens: jest.fn(),
      setTokens: jest.fn(),
      removeTokens: jest.fn(),
      authorize: jest.fn(),
      authorizationRequest: jest.fn(),
    })),
    RedirectMethod: {
      AppURI: 'app-uri',
    },
  },
  showToast: jest.fn(),
  Toast: {
    Style: {
      Failure: 'failure',
      Success: 'success',
    },
  },
}));

// Mock node-fetch
jest.mock('node-fetch', () => 
  jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Map([
        ['X-RateLimit-Remaining', '10'],
        ['X-RateLimit-Reset', '1600000000'],
      ]),
    })
  )
);

// Global test timeout
jest.setTimeout(10000);

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test environment setup
process.env.DISCORD_CLIENT_ID = 'test-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-client-secret';