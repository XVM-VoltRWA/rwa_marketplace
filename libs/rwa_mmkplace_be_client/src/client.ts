import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
    RwaClientConfig,
    CreateNftRequest,
    CreateNftResponse,
    CreateOfferRequest,
    CreateOfferResponse,
    SignInResponse,
    SignInStatusResponse,
    ApiResponse,
    ApiError
} from './types/index';

/**
 * RWA Marketplace Backend Client
 * 
 * Axios wrapper for interacting with RWA Marketplace backend functions
 */
export class RwaMarketplaceClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor(config: RwaClientConfig) {
        this.baseURL = config.baseURL;

        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => {
                const apiError: ApiError = {
                    message: String(error.response?.data) || error.message,
                    status: error.response?.status,
                    code: error.code,
                };
                return Promise.reject(apiError);
            }
        );
    }

    /**
     * Create NFT
     * 
     * Creates an NFT on XRPL with optional transfer to owner
     * 
     * @param request - NFT creation parameters
     * @returns Promise<CreateNftResponse>
     */
    async createNft(request: CreateNftRequest): Promise<ApiResponse<CreateNftResponse>> {
        try {
            const response: AxiosResponse<CreateNftResponse> = await this.client.post(
                '/create-nft',
                request
            );

            return {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            throw error as ApiError;
        }
    }

    /**
     * Create Offer
     * 
     * Creates a sell or buy offer for an NFT on XRPL
     * 
    * @param request - Offer creation parameters (note: `user_address` is optional; backend may derive from session)
    * @returns Promise<CreateOfferResponse>
     */
    async createOffer(request: CreateOfferRequest): Promise<ApiResponse<CreateOfferResponse>> {
        try {
            const response: AxiosResponse<CreateOfferResponse> = await this.client.post(
                '/create-offer',
                request
            );

            return {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            throw error as ApiError;
        }
    }

    /**
     * XUMM Sign-in - Create sign-in request
     * 
     * Creates a XUMM sign-in payload for wallet authentication
     * 
    * @param request - Sign-in parameters. `wallet_address` is optional; backend can initiate a sign-in without pre-specified wallet.
    * @returns Promise<SignInResponse>
     */
    async xummSignIn(request?: { wallet_address?: string }): Promise<ApiResponse<SignInResponse>> {
        try {
            const response: AxiosResponse<SignInResponse> = await this.client.post(
                '/xumm-signin',
                request || {}
            );

            return {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            throw error as ApiError;
        }
    }

    /**
     * XUMM Sign-in Status - Check payload status and get user token
     * 
     * Checks the status of a XUMM sign-in payload and retrieves user token if signed
     * 
     * @param payloadId - The XUMM payload ID to check
     * @returns Promise<SignInStatusResponse>
     */
    async getXummSignInStatus(payloadId: string): Promise<ApiResponse<SignInStatusResponse>> {
        try {
            const response: AxiosResponse<SignInStatusResponse> = await this.client.get(
                `/xumm-signin?payload_id=${payloadId}`
            );

            return {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
            };
        } catch (error) {
            throw error as ApiError;
        }
    }

    /**
     * Update client configuration
     * 
     * @param config - New configuration to merge
     */
    updateConfig(config: Partial<RwaClientConfig>): void {
        if (config.baseURL) {
            this.baseURL = config.baseURL;
            this.client.defaults.baseURL = config.baseURL;
        }

        if (config.timeout) {
            this.client.defaults.timeout = config.timeout;
        }

        if (config.headers) {
            // Update headers properly for axios
            Object.assign(this.client.defaults.headers.common, config.headers);
        }
    }

    /**
     * Get current base URL
     */
    getBaseURL(): string {
        return this.baseURL;
    }
}

export default RwaMarketplaceClient;