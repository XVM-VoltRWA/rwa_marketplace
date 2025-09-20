/**
 * Type definitions for NFT Offer system
 * Contains all interfaces and types used by repository and service layers
 */

export interface NFTOfferData {
    id?: string;
    nft_token_id: string;
    offer_type: 'sell' | 'buy';
    user_address: string;
    amount: string;
    owner_address?: string;
    payload_id: string;
    payload_created_at?: string;
    payload_expires_at?: string;
    status: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
    tx_hash?: string;
    signed_at?: string;
    completed_at?: string;
    deep_link?: string;
    qr_code?: string;
    pushed?: boolean;
    error_message?: string;
    created_at?: string;
    updated_at?: string;
}

export interface NFTOfferFilter {
    user_address?: string;
    nft_token_id?: string;
    offer_type?: 'sell' | 'buy';
    status?: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
    limit?: number;
    offset?: number;
}

export interface NFTOfferUpdate {
    status?: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
    tx_hash?: string;
    signed_at?: string;
    completed_at?: string;
    error_message?: string;
}

export interface CreateOfferInput {
    nft_token_id: string;
    offer_type: 'sell' | 'buy';
    user_address: string;
    amount: string;
    owner_address?: string;
    deep_link?: string;
    qr_code?: string;
    pushed?: boolean;
}

export interface OfferStatusResult {
    offer: NFTOfferData;
    updated: boolean;
}

// Repository method return types
export interface FindManyResult {
    offers: NFTOfferData[];
    count: number;
}

// Service method return types
export interface ListOffersResult {
    offers: NFTOfferData[];
    totalCount: number;
    limit: number;
    offset: number;
}

// Webhook payload types
export interface WebhookPayload {
    meta: {
        uuid: string;
        signed: boolean;
        cancelled: boolean;
        expired: boolean;
    };
    payloadResponse?: {
        txid: string;
    } | null;
}