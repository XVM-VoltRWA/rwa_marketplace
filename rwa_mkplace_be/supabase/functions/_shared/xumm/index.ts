/**
 * Lightweight XUMM helper that builds payload bodies for XUMM SDK.
 * We avoid taking a direct dependency on the SDK or QR code generation here so
 * callers can decide how/where to execute the SDK call (honoring environment limits).
 *
 * */
import { XummSdk } from "npm:xumm-sdk";
import QRCode from "npm:qrcode@1.5.3";
import { XummPayloadBody, XummPayloadResult } from "./type.ts";

export class XummService {
    public constructor(private apiKey: string, private apiSecret: string) {
    }
    /**
     * Build a payload body that can be passed to Xumm SDK's payload.create.
     */
    buildXummPayloadBody(txjson: Record<string, unknown>, expireSeconds = 10): XummPayloadBody {
        return { txjson, options: { submit: true, expire: expireSeconds } };
    }

    /**
     * Create a payload using the Xumm SDK and return uuid, deep link and QR code data URL.
     */
    async createXummPayload(txjson: Record<string, unknown>, expireSeconds = 10): Promise<XummPayloadResult> {
        const xumm = new XummSdk(this.apiKey, this.apiSecret);
        // allow runtime payload creation; cast to 'never' to avoid explicit-any lint
        // @ts-ignore: SDK typing mismatch in this environment; runtime payload body is valid
        const payload = await xumm.payload.create({ txjson: txjson, options: { submit: true, expire: expireSeconds } } as unknown as never);
        if (!payload) throw new Error("Failed to create XUMM payload");
        const uuid = payload.uuid;
        const deepLink = `https://xumm.app/sign/${uuid}`;
        const qrCodeDataUrl = await QRCode.toDataURL(deepLink);
        return { uuid, deepLink, qrCodeDataUrl };
    }
}

export default XummService;

