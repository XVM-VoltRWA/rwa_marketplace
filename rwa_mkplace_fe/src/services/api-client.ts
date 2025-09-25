import RwaMarketplaceClient from 'rwa-marketplace-be-client';

// Initialize the client with your backend URL
// You can use environment variables for different environments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jolwtctrssloylbepcrj.supabase.co/functions/v1';

// Create a singleton instance of the client
export const apiClient = new RwaMarketplaceClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    // Add any custom headers here if needed
  }
});

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Example service functions using the client

/**
 * Sign in with XUMM wallet
 */
export const signIn = async () => {
  try {
    const response = await apiClient.xummSignIn();
    return response.data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Check sign-in status
 */
export const checkSignInStatus = async (payloadId: string) => {
  try {
    const response = await apiClient.getXummSignInStatus(payloadId);
    return response.data;
  } catch (error) {
    console.error('Check sign-in status error:', error);
    throw error;
  }
};

/**
 * Create a new NFT
 */
export const createNft = async (name: string, imageUrl: string, metadata?: Record<string, unknown>) => {
  try {
    // Update client headers with auth token
    const token = localStorage.getItem('jwt_token');
    console.log('JWT token from localStorage:', token ? 'Found' : 'Not found');

    if (token) {
      apiClient.updateConfig({
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.warn('No JWT token found. User may need to sign in first.');
    }

    const response = await apiClient.createNft({
      name,
      image_url: imageUrl,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Create NFT error:', error);
    throw error;
  }
};

/**
 * Create an offer for an NFT
 */
export const createOffer = async (nftTokenId: string, type: 'sell' | 'buy', amount?: number) => {
  try {
    // Update client headers with auth token
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      apiClient.updateConfig({ headers: authHeaders });
    }

    const response = await apiClient.createOffer({
      nft_token_id: nftTokenId,
      type,
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Create offer error:', error);
    throw error;
  }
};

/**
 * Get current user info (if you add this endpoint to your backend)
 */
export const getCurrentUser = async () => {
  // This is an example - you'd need to add this endpoint to your backend
  try {
    // const response = await apiClient.getCurrentUser();
    // return response.data;

    // For now, return mock data
    return {
      wallet: localStorage.getItem('wallet_address'),
      jwt: localStorage.getItem('jwt_token')
    };
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// Export the types for use in components
export type {
  SignInResponse,
  SignInStatusResponse,
  CreateNftResponse,
  CreateOfferResponse
} from 'rwa-marketplace-be-client';