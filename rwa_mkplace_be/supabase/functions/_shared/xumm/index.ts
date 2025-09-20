/**
 * Lightweight XUMM helper that builds payload bodies for XUMM SDK.
 * We avoid taking a direct dependency on the SDK or QR code generation here so
 * callers can decide how/where to execute the SDK call (honoring environment limits).
 *
 * */
import { XummSdk, SdkTypes } from "npm:xumm-sdk@1.11.2";
import QRCode from "npm:qrcode@1.5.3";
import { XummJsonTransaction, XummPayloadBody, XummPayloadResult, XummSignInPayload, XummPayloadStatus } from "./type.ts";

export class XummService {
    public constructor(private apiKey: string, private apiSecret: string) {
    }

    // Create a new XummSdk instance for each operation.
    private sdk(): XummSdk {
        return new XummSdk(this.apiKey, this.apiSecret);
    }

    // Map SDK payload into our simple result shape and generate QR code.
    private async mapPayloadResult(payload: unknown): Promise<XummPayloadResult> {
        if (!payload || typeof payload !== "object") throw new Error("Failed to create XUMM payload");

        const p = payload as Record<string, unknown>;

        const rawUuid = p["uuid"];
        if (rawUuid === undefined || rawUuid === null) throw new Error("Payload missing uuid");

        const uuid = String(rawUuid);
        const deepLink = `https://xumm.app/sign/${uuid}`;
        const qrCodeDataUrl = await QRCode.toDataURL(deepLink);

        const pushed = Boolean(p["pushed"]);

        return {
            uuid,
            deepLink,
            qrCodeDataUrl,
            pushed
        };
    }
    /**
     * Build a payload body that can be passed to Xumm SDK's payload.create.
     */
    buildXummPayloadBody(txjson: XummJsonTransaction, expireSeconds = 10): XummPayloadBody {
        return { txjson, options: { submit: true, expire: expireSeconds } };
    }

    /**
     * Create a payload using the Xumm SDK and return uuid, deep link and QR code data URL.
     * If userToken is provided, the request will be pushed directly to the user's XUMM app.
     *
     * @param txjson - The transaction JSON to be signed
     * @param expireSeconds - How long the payload should remain valid (default: 10 minutes)
     * @param userToken - Optional XUMM user token for push notifications
     * @returns Payload result with UUID, deep link, QR code, and push status
     */
    async createXummPayload(
        txjson: XummJsonTransaction,
        expireSeconds = 600,
        userToken?: string
    ): Promise<XummPayloadResult> {
        const xumm = this.sdk();

        const payloadConfig: XummPayloadBody & { user_token?: string } = {
            txjson,
            options: {
                submit: true,
                expire: expireSeconds
            }
        };

        if (userToken) {
            payloadConfig.user_token = userToken;
            console.log("Creating XUMM payload with push notification for user token");
        }

        // @ts-ignore: SDK typing mismatch in this environment; runtime payload body is valid
        const payload = await xumm.payload.create(payloadConfig);

        const result = await this.mapPayloadResult(payload);

        if (result.pushed) console.log(`Push notification sent successfully for payload ${result.uuid}`);

        return result;
    }

    /**
     * Create a sign-in payload for XUMM authentication.
     * Returns payload details including QR code for user to scan.
     */
    async createSignInPayload(walletAddress?: string): Promise<XummPayloadResult> {
        const xumm = this.sdk();

        const signInPayload: XummSignInPayload = {
            txjson: {
                TransactionType: "SignIn"
            },
            options: {
                submit: false,
                expire: 600 // 10 minutes
            }
        };

        if (walletAddress) signInPayload.txjson.Account = walletAddress;

        // @ts-ignore: SDK typing mismatch in this environment
        const payload = await xumm.payload.create(signInPayload);

        return this.mapPayloadResult(payload);
    }

    /**
     * Get the status of a XUMM payload and retrieve user token if signed.
     */
    async getPayloadStatus(payloadId: string): Promise<XummPayloadStatus> {
        const xumm = this.sdk();

        const payload: SdkTypes.XummPayload | null = await xumm.payload.get(payloadId);

        if (!payload) throw new Error("Payload not found");

        const meta = payload.meta;

        console.log("hex: ", payload.meta);

        return {
            hex: payload.response?.hex || undefined,
            signed: Boolean(meta?.signed),
            resolved: Boolean(meta?.resolved),
            expired: Boolean(meta?.expired),
            cancelled: Boolean(meta?.cancelled),
            user_token: payload.application?.issued_user_token || undefined,
            wallet_address: payload.response?.account || undefined
        };
    }
}

export default XummService;

