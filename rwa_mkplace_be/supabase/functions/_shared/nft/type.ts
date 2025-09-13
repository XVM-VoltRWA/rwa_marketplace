import type { TransactionMetadataBase } from "npm:xrpl@4.4.1";

export type MintResult = {
    nftTokenId: string;
    txHash: string;
    meta: unknown;
};

export type MintOptions = {
    name: string;
    imageUrl: string;
    metadata?: Record<string, unknown>;
    flags?: number;
    taxon?: number;
    transferFee?: number;
};

export interface NFTokenMintMetadata extends TransactionMetadataBase {
    // rippled 1.11.0 or later
    nftoken_id?: string
    // if Amount is present
    offer_id?: string
}

export type OfferOptions = {
    amount?: string; // default: "0"
    // if set, offer = sell offer
    // if not, offer = buy offer
    flags?: number;
};

export type OfferResult = {
    transferTxHash?: string;
    offerIndex?: string;
};

export type SellOffer = { amount?: string; destination?: string; nft_offer_index?: string };