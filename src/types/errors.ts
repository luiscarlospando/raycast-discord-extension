export class DiscordError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode?: number,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'DiscordError';
        Object.setPrototypeOf(this, DiscordError.prototype);
    }

    public toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            details: this.details,
        };
    }
}

export class AuthenticationError extends DiscordError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'AUTH_ERROR', 401, details);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class RateLimitError extends DiscordError {
    constructor(message: string, retryAfter: number) {
        super(message, 'RATE_LIMIT', 429, { retryAfter });
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

export class PermissionError extends DiscordError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'PERMISSION_ERROR', 403, details);
        this.name = 'PermissionError';
        Object.setPrototypeOf(this, PermissionError.prototype);
    }
}

export class ValidationError extends DiscordError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class NetworkError extends DiscordError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'NETWORK_ERROR', 0, details);
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

export class ServerError extends DiscordError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'SERVER_ERROR', 500, details);
        this.name = 'ServerError';
        Object.setPrototypeOf(this, ServerError.prototype);
    }
}