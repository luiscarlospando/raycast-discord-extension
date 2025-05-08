import { LocalStorage, OAuth } from "@raycast/api";
import crypto from "crypto";
import { getEnvVar } from "../env";
import { logger } from "../logger";

interface EncryptedData {
  iv: string;
  data: string;
}

interface StoredTokens extends OAuth.TokenResponse {
  timestamp: number;
}

const ENCRYPTION_KEY = getEnvVar("ENCRYPTION_KEY");
const TOKEN_STORAGE_KEY = getEnvVar("TOKEN_STORAGE_KEY", "discord_oauth_tokens");
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export class TokenStorage {
  private static instance: TokenStorage;

  private constructor() {}

  public static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  private encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      iv: iv.toString("hex"),
      data: encrypted,
    };
  }

  private decrypt(encrypted: EncryptedData): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(encrypted.iv, "hex")
    );

    let decrypted = decipher.update(encrypted.data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  public async storeTokens(tokens: OAuth.TokenResponse): Promise<void> {
    try {
      const storedTokens: StoredTokens = {
        ...tokens,
        timestamp: Date.now(),
      };

      const encrypted = this.encrypt(JSON.stringify(storedTokens));
      await LocalStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(encrypted));
      logger.debug("Tokens stored successfully");
    } catch (error) {
      logger.error("Failed to store tokens:", error);
      throw new Error("Failed to store tokens securely");
    }
  }

  public async getTokens(): Promise<OAuth.TokenResponse | null> {
    try {
      const storedData = await LocalStorage.getItem<string>(TOKEN_STORAGE_KEY);
      if (!storedData) {
        return null;
      }

      const encrypted = JSON.parse(storedData) as EncryptedData;
      const decrypted = this.decrypt(encrypted);
      const tokens = JSON.parse(decrypted) as StoredTokens;

      // Check if tokens are expired
      if (Date.now() - tokens.timestamp > TOKEN_EXPIRY) {
        await this.removeTokens();
        return null;
      }

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scope: tokens.scope,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      logger.error("Failed to retrieve tokens:", error);
      await this.removeTokens();
      return null;
    }
  }

  public async removeTokens(): Promise<void> {
    try {
      await LocalStorage.removeItem(TOKEN_STORAGE_KEY);
      logger.debug("Tokens removed successfully");
    } catch (error) {
      logger.error("Failed to remove tokens:", error);
      throw new Error("Failed to remove tokens");
    }
  }

  public async hasValidTokens(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null;
  }
}

export const tokenStorage = TokenStorage.getInstance();