// NFT Creation Types
export interface CreateNftRequest {
    name: string;
    image_url: string;
    metadata?: Record<string, unknown>;
    // optional destination address to create a transfer offer for after minting
    owner_address?: string;
    // optional XUMM user token for push notifications (obtained from previous XUMM sign-in)
    xumm_user_token?: string;
}

export interface OfferAcceptance {
    payload_id?: string;
    deep_link?: string;
    qr_code?: string;
    offer_index?: string | null;
    instruction?: string;
    pushed?: boolean; // indicates if payload was pushed to user's XUMM app
}

export interface CreateNftResponse {
    success: boolean;
    // Mint tx related
    nft_token_id?: string;
    mint_transaction_hash?: string;
    mint_explorer_link?: string;
    network?: string;
    minter_address?: string;

    // Give to creator related (sell offer with 0)
    // for transfer nft to creator
    transfer_offer_hash?: string;
    // index of the sell offer, if any
    offer_index?: string;

    // XUMM QR code and payload to accept the offer, if created
    acceptance?: OfferAcceptance;
    manual_acceptance?: { offer_index?: string | null; instruction?: string };

    // human readable message or error
    message?: string;
    error?: string;
}

// Create Offer Types
export interface CreateOfferRequest {
    nft_token_id: string;
    type: "sell" | "buy";
    user_address: string; // the address of the user creating the offer
    amount?: string; // optional, defaults to "0" (in drops)
    // optional XUMM user token for push notifications (obtained from previous XUMM sign-in)
    xumm_user_token?: string;
}

export interface CreateOfferResponse {
    success: boolean;
    // Payload details for XUMM signing
    payload_id?: string;
    deep_link?: string;
    qr_code?: string;
    pushed?: boolean;
    // human readable message or error
    message?: string;
    error?: string;
}

// XUMM Sign-in Types
export interface SignInRequest {
    wallet_address?: string;
}

export interface SignInResponse {
    success: boolean;
    payload_id: string;
    qr_code?: string;
    deep_link?: string;
    message: string;
    next_step?: string;
    webhook_url?: string;
    expires_at?: string;
    error?: string;
}

export interface SignInStatusResponse {
    success: boolean;
    payload_id: string;
    signed: boolean;
    status: "resolved" | "pending";
    user_token?: string;
    wallet_address?: string;
    message: string;
    instructions?: string;
    expired?: boolean;
    cancelled?: boolean;
    error?: string;
}

// Client Configuration Types
export interface RwaClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

// API Response wrapper
export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

// Error response type
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}