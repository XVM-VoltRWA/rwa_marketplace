/**
 * Lightweight XUMM helper that builds payload bodies for XUMM SDK.
 * We avoid taking a direct dependency on the SDK or QR code generation here so
 * callers can decide how/where to execute the SDK call (honoring environment limits).
 *
 * */
import { XummSdk, SdkTypes } from "npm:xumm-sdk@1.11.2";
import { XummPayloadStatus, XummPayloadEnrich, TX_TYPE } from "./type.ts";

export class XummService {
    public constructor(private apiKey: string, private apiSecret: string) {
    }

    // Create a new XummSdk instance for each operation.
    private sdk(): XummSdk {
        return new XummSdk(this.apiKey, this.apiSecret);
    }

    /**
     * Create a sign-in payload for XUMM authentication.
     * Returns payload details including QR code for user to scan.
     */
    async createSignInPayload(): Promise<SdkTypes.XummPostPayloadResponse | null> {
        const xumm = this.sdk();
        const signInPayload: SdkTypes.CreatePayload = {
            txjson: {
                TransactionType: "SignIn"
            },
            options: {
                submit: false,
                expire: 600 // 10 minutes
            },
            custom_meta: {
                blob: {
                    "type": TX_TYPE.SIGN_IN,
                }
            }
        };
        // if (walletAddress) signInPayload.txjson.Account = walletAddress;
        const payload = await xumm.payload.create(signInPayload);
        return payload;
    }

    async createAcceptOfferPayload(
        walletAddress: string,
        nftSellOfferIndex: string,
    ) {
        const xumm = this.sdk();
        const payload: SdkTypes.CreatePayload = {
            txjson: {
                TransactionType: "NFTokenAcceptOffer",
                Account: walletAddress,
                NFTokenSellOffer: nftSellOfferIndex,
            },
            options: {
                submit: true,
                expire: 600 // 10 minutes
            },
            custom_meta: {
                blob: {
                    "type": TX_TYPE.ACCEPT_OFFER,
                    "nftSellOfferIndex": nftSellOfferIndex,
                }
            }
        };
        return await xumm.payload.create(payload);
    }

    async createNftOfferPayload(
        walletAddress: string,
        params: {
            nftTokenId: string,
            amount?: string,
            type?: 'sell' | 'buy',
            // nft owner
            owner?: string,
            destination?: string,
        },
        expireSeconds = 600,
    ): Promise<SdkTypes.XummPostPayloadResponse | null> {
        const xumm = this.sdk();

        // Build NFTokenCreateOffer txjson following rules:
        // - Caller provides account (walletAddress), nftTokenId, amount
        // - owner only applies for buy offers, for indicateing current NFT owner
        // - destination should be the backend wallet address for broker mode
        // - sell offers set Flags = 1, buy offers do not set Flags
        const txjson: SdkTypes.XummJsonTransaction = {
            TransactionType: 'NFTokenCreateOffer',
            Account: walletAddress,
            NFTokenID: params.nftTokenId,
            Amount: params.amount ?? '0',
            Destination: params.destination,
        };

        if (params.type === 'buy' && params.owner) {
            txjson.Owner = params.owner;
        }

        if (params.type === 'sell') {
            txjson.Flags = 1;
        }

        const payloadBody: SdkTypes.CreatePayload = {
            txjson,
            options: {
                submit: true,
                expire: expireSeconds,
            },
            custom_meta: {
                blob: {
                    type: params.type === 'buy' ? TX_TYPE.CREATE_BUY_OFFER : TX_TYPE.CREATE_SELL_OFFER,
                    nftTokenId: params.nftTokenId,
                    amount: params.amount,
                }
            }
        };

        const created = await xumm.payload.create(payloadBody);


        return created;
    }

    /**
     * Get the status of a XUMM payload and retrieve user token if signed.
     */
    async getPayloadStatus(payloadId: string): Promise<XummPayloadStatus> {
        const xumm = this.sdk();

        const payload: SdkTypes.XummPayload | null = await xumm.payload.get(payloadId);
        if (!payload) throw new Error("Payload not found");
        return {
            hex: payload.response?.hex || undefined,
            signed: Boolean(payload.meta?.signed),
            resolved: Boolean(payload.meta?.resolved),
            expired: Boolean(payload.meta?.expired),
            cancelled: Boolean(payload.meta?.cancelled),
            user_token: payload.application?.issued_user_token || undefined,
            wallet_address: payload.response?.account || undefined
        };
    }


    // Enrich payload with deep link (and potentially QR code in future).
    public enrichPayload(payload: SdkTypes.XummPostPayloadResponse): SdkTypes.XummPostPayloadResponse & XummPayloadEnrich {
        const uuid = payload.uuid;
        const deepLink = `https://xumm.app/sign/${uuid}`;
        return {
            ...payload,
            deepLink,
        };
    }
}

export default XummService;

