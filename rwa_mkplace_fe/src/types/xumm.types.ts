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

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  xummUserToken: string | null;
  error: string | null;
}