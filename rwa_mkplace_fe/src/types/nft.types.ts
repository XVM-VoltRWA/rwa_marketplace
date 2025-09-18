export interface NFTMetadata {
  external_link?: string;
  description: string;
  category?: string;
  properties?: Record<string, string>;
  valuation?: number;
}

export interface CreateNFTRequest {
  name: string;
  image_url: string;
  owner_address: string;
  metadata: NFTMetadata;
  xumm_user_token?: string; // Optional XUMM user token for push notifications
}

export interface CreateNFTResponse {
  success: boolean;
  nft_token_id?: string;
  mint_transaction_hash?: string;
  mint_explorer_link?: string;
  transfer_offer_hash?: string;
  transfer_offer_link?: string;
  transfer_status?: string;
  network?: string;
  minter_address?: string;
  owner_address?: string;
  acceptance?: {
    qr_code: string;
    deep_link: string;
    payload_id: string;
    offer_index: string;
    instruction: string;
    pushed?: boolean; // Indicates if notification was pushed to XUMM wallet
  };
  manual_acceptance?: {
    offer_index: string;
    instruction: string;
  };
  message?: string;
  error?: string;
}