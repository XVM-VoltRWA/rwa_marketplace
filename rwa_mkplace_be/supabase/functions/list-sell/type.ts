export interface ListSellRequest {
  user_address?: string;
  nft_token_id?: string;
  status?: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}

export interface SellOfferData {
  id: string;
  nft_token_id: string;
  offer_type: 'sell';
  user_address: string;
  amount: string;
  owner_address?: string;
  status: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
  payload_id: string;
  tx_hash?: string;
  created_at: string;
  updated_at: string;
  signed_at?: string;
  completed_at?: string;
  error_message?: string;
  deep_link?: string;
  qr_code?: string;
  pushed?: boolean;
}

export interface ListSellResponse {
  success: boolean;
  offers: SellOfferData[];
  total_count: number;
  limit: number;
  offset: number;
  error?: string;
}