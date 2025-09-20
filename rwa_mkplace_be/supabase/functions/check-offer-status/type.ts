export interface CheckOfferStatusRequest {
    payload_id?: string;
    offer_id?: string;
}

export interface CheckOfferStatusResponse {
    success: boolean;
    offer?: {
        id: string;
        nft_token_id: string;
        offer_type: 'sell' | 'buy';
        user_address: string;
        amount: string;
        status: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
        payload_id: string;
        tx_hash?: string;
        created_at: string;
        updated_at: string;
        signed_at?: string;
        completed_at?: string;
        error_message?: string;
    };
    error?: string;
}