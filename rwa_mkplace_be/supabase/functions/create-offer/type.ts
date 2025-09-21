export type CreateOfferRequest = {
    nft_token_id: string;
    type: "sell" | "buy";
    // Amount in drops (1 drop = 0.000001 XRP). Use a number here for API ease.
    amount?: number; // optional, defaults to 0
};

export type OfferAcceptance = {
    payload_id?: string;
    deep_link?: string;
    qr_code?: string;
    offer_index?: string | null;
    instruction?: string;
    pushed?: boolean;  // indicates if payload was pushed to user's XUMM app
};

export type CreateOfferResponse = {
    success: boolean;
    // Payload details for XUMM signing
    payload_id?: string;
    deep_link?: string;
    // human readable message or error
    message?: string;
    error?: string;
};

// Helper type for the handler function contract
export type CreateOfferHandler = (input: CreateOfferRequest) => Promise<CreateOfferResponse>;