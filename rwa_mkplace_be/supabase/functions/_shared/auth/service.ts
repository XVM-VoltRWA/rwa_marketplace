import type { JwtPayload, AuthServiceOptions } from './type.ts';
import config from '../config/index.ts';

/**
 * AuthService
 *
 * Lightweight JWT session utility used by server functions. Generates and verifies
 * HS256 signed JWTs using the server `JWT_SECRET` configured in `config`.
 */
export class AuthService {
    private defaultTtl: number;
    private encoder = new TextEncoder();

    /**
     * Create an AuthService instance.
     *
     * Uses `opts.defaultTtl` when provided, otherwise falls back to
     * `config.SESSION_TIMEOUT`, and finally to 3600 seconds.
     */
    constructor(opts: AuthServiceOptions = {}) {
        this.defaultTtl = opts.defaultTtl ?? config.SESSION_TIMEOUT ?? 3600; // seconds
    }

    /**
     * Encode bytes into URL-safe base64 (base64url) without padding.
     *
     * Used to produce JWT header/payload/signature segments that are
     * safe to transport in URLs and HTTP headers.
     */
    private base64url(input: Uint8Array): string {
        const b64 = btoa(String.fromCharCode(...input));
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    /**
     * JSON-stringify the object and return its base64url encoding.
     *
     * This helper is used for encoding JWT header and payload sections.
     */
    private encodeJson(obj: unknown): string {
        const json = JSON.stringify(obj);
        return this.base64url(this.encoder.encode(json));
    }

    /**
     * Sign the given message using HMAC-SHA256 with the provided secret.
     *
     * Returns the signature as a base64url string. Uses Web Crypto `subtle`.
     */
    private async sign(message: string, secret: string): Promise<string> {
        const key = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, this.encoder.encode(message));
        return this.base64url(new Uint8Array(sig));
    }

    /**
     * Create a session JWT for the given wallet address.
     *
     * The token is HS256-signed using `config.JWT_SECRET` and includes
     * `sub`, `iat`, `exp` claims. Optionally includes `push_token` when provided.
     * @param walletAddress - wallet address to place in `sub` claim
     * @param ttlSeconds - optional TTL override in seconds
     * @param pushToken - optional push token to embed in payload
     * @returns signed JWT string (compact form)
     * @throws when `JWT_SECRET` is not configured
     */
    async createSessionJwt(walletAddress: string, ttlSeconds?: number, pushToken?: string): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload: Record<string, unknown> = {
            sub: walletAddress,
            iat: now,
            exp: now + (ttlSeconds ?? this.defaultTtl),
        };

        if (pushToken) {
            payload.push_token = pushToken;
        }
        const headerB64 = this.encodeJson(header);
        const payloadB64 = this.encodeJson(payload);
        const signingInput = `${headerB64}.${payloadB64}`;
        const secret = config.JWT_SECRET || '';
        if (!secret) throw new Error('JWT_SECRET not configured');
        const signature = await this.sign(signingInput, secret);
        return `${signingInput}.${signature}`;
    }

    /**
     * Verify a session JWT and return the decoded payload when valid.
     *
     * This recomputes the HMAC-SHA256 signature, checks equality, parses
     * the JSON payload and validates the `exp` claim. Returns `null` for
     * malformed, invalid or expired tokens.
     * @param token - compact JWT string to verify
     * @returns decoded `JwtPayload` or `null` when verification fails
     */
    async verifySessionJwt(token: string): Promise<JwtPayload | null> {
        try {
            const [headerB64, payloadB64, sig] = token.split('.');
            if (!headerB64 || !payloadB64 || !sig) return null;
            const signingInput = `${headerB64}.${payloadB64}`;
            const secret = config.JWT_SECRET || '';
            if (!secret) throw new Error('JWT_SECRET not configured');
            const expected = await this.sign(signingInput, secret);
            if (sig !== expected) return null;
            const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
            const payload = JSON.parse(payloadJson);
            const now = Math.floor(Date.now() / 1000);
            if (typeof payload.exp === 'number' && payload.exp < now) return null;
            return payload;
        } catch {
            return null;
        }
    }
}
