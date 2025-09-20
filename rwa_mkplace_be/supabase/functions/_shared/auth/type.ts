export interface JwtPayload {
    sub: string;
    iat: number;
    exp: number;
    // Optional additional claims (e.g., push token)
    push_token?: string;
    [key: string]: unknown;
}

export interface AuthServiceOptions {
    defaultTtl?: number; // seconds
}
