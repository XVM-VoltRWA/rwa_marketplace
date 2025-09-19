export type CreateOfferRequest = {
    nft_token_id: string;
    type: "sell" | "buy";
    user_address: string; // the address of the user creating the offer
    amount?: string; // optional, defaults to "0"
    // optional XUMM user token for push notifications (obtained from previous XUMM sign-in)
    xumm_user_token?: string;
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
    qr_code?: string;
    pushed?: boolean;
    // human readable message or error
    message?: string;
    error?: string;
};

// Helper type for the handler function contract
export type CreateOfferHandler = (input: CreateOfferRequest) => Promise<CreateOfferResponse>;