import { NFTOfferRepository } from "./repository.ts";
import type {
    NFTOfferData,
    NFTOfferFilter,
    NFTOfferUpdate,
    CreateOfferInput,
    OfferStatusResult,
    ListOffersResult,
    WebhookPayload
} from "./type.ts";
import XummService from "../xumm/index.ts";
import config from "../config/index.ts";/**
 * Service class for NFT offer business logic
 * Handles offer creation, status updates, and integrates with XUMM
 */
export class NFTOfferService {
    private repository: NFTOfferRepository;
    private xummService?: XummService;

    constructor() {
        this.repository = new NFTOfferRepository();

        // Initialize XUMM service if credentials are available
        if (config.XUMM_API_KEY && config.XUMM_API_SECRET) {
            this.xummService = new XummService(config.XUMM_API_KEY, config.XUMM_API_SECRET);
        }
    }

    /**
     * Create a new NFT offer
     */
    async createOffer(input: CreateOfferInput & { payload_id: string }): Promise<NFTOfferData> {
        try {
            const offerData: Omit<NFTOfferData, 'id' | 'created_at' | 'updated_at'> = {
                nft_token_id: input.nft_token_id,
                offer_type: input.offer_type,
                user_address: input.user_address,
                amount: input.amount,
                owner_address: input.owner_address,
                payload_id: input.payload_id,
                deep_link: input.deep_link,
                qr_code: input.qr_code,
                pushed: input.pushed || false,
                status: 'pending'
            };

            const createdOffer = await this.repository.create(offerData);
            console.log(`Created offer ${createdOffer.id} with payload_id: ${input.payload_id}`);

            return createdOffer;
        } catch (error) {
            console.error('Failed to create offer:', error);
            throw new Error(`Service: Failed to create offer - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get offer by payload ID
     */
    async getOfferByPayloadId(payloadId: string): Promise<NFTOfferData | null> {
        try {
            return await this.repository.findByPayloadId(payloadId);
        } catch (error) {
            console.error('Failed to get offer by payload ID:', error);
            throw new Error(`Service: Failed to get offer - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get offer by ID
     */
    async getOfferById(id: string): Promise<NFTOfferData | null> {
        try {
            return await this.repository.findById(id);
        } catch (error) {
            console.error('Failed to get offer by ID:', error);
            throw new Error(`Service: Failed to get offer - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update offer status by payload ID
     */
    async updateOfferStatus(payloadId: string, updates: NFTOfferUpdate): Promise<NFTOfferData> {
        try {
            const updatedOffer = await this.repository.updateByPayloadId(payloadId, updates);
            console.log(`Updated offer ${updatedOffer.id} to status: ${updates.status}`);

            return updatedOffer;
        } catch (error) {
            console.error('Failed to update offer status:', error);
            throw new Error(`Service: Failed to update offer - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Check and sync offer status with XUMM
     * Returns the offer and whether it was updated
     */
    async checkAndSyncOfferStatus(payloadId: string): Promise<OfferStatusResult> {
        try {
            const offer = await this.repository.findByPayloadId(payloadId);
            if (!offer) {
                throw new Error('Offer not found');
            }

            // If offer is not pending or XUMM service is not available, return current state
            if (offer.status !== 'pending' || !this.xummService) {
                return { offer, updated: false };
            }

            try {
                const xummStatus = await this.xummService.getPayloadStatus(payloadId);

                let shouldUpdate = false;
                const updates: NFTOfferUpdate = {};

                // Determine status based on XUMM response
                if (xummStatus.expired) {
                    updates.status = 'expired';
                    shouldUpdate = true;
                } else if (xummStatus.cancelled) {
                    updates.status = 'rejected';
                    shouldUpdate = true;
                } else if (xummStatus.signed && xummStatus.resolved) {
                    updates.status = 'completed';
                    updates.signed_at = new Date().toISOString();
                    updates.completed_at = new Date().toISOString();
                    shouldUpdate = true;
                } else if (xummStatus.signed && !xummStatus.resolved) {
                    updates.status = 'failed';
                    updates.error_message = 'Transaction signed but not resolved';
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    const updatedOffer = await this.repository.updateByPayloadId(payloadId, updates);
                    return { offer: updatedOffer, updated: true };
                }

                return { offer, updated: false };

            } catch (xummError) {
                console.error('Error checking XUMM status:', xummError);
                // Return current database status if XUMM check fails
                return { offer, updated: false };
            }

        } catch (error) {
            console.error('Failed to check offer status:', error);
            throw new Error(`Service: Failed to check offer status - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Process XUMM webhook payload and update offer status
     */
    async processWebhookUpdate(webhookPayload: WebhookPayload): Promise<NFTOfferData> {
        try {
            const payloadId = webhookPayload.meta.uuid;

            // Determine new status
            let newStatus: 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed';
            const updateData: NFTOfferUpdate = {};

            if (webhookPayload.meta.expired) {
                newStatus = 'expired';
            } else if (webhookPayload.meta.cancelled) {
                newStatus = 'rejected';
            } else if (webhookPayload.meta.signed && webhookPayload.payloadResponse) {
                newStatus = 'completed';
                updateData.signed_at = new Date().toISOString();
                updateData.completed_at = new Date().toISOString();
                updateData.tx_hash = webhookPayload.payloadResponse.txid;
            } else if (webhookPayload.meta.signed && !webhookPayload.payloadResponse) {
                newStatus = 'failed';
                updateData.error_message = 'Transaction signed but no response received';
            } else {
                newStatus = 'pending';
            }

            updateData.status = newStatus;

            const updatedOffer = await this.repository.updateByPayloadId(payloadId, updateData);
            console.log(`Webhook updated offer ${updatedOffer.id} to status: ${newStatus}`);

            return updatedOffer;

        } catch (error) {
            console.error('Failed to process webhook update:', error);
            throw new Error(`Service: Failed to process webhook - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List offers with filters and pagination
     */
    async listOffers(filter: NFTOfferFilter = {}): Promise<ListOffersResult> {
        try {
            const { offers, count } = await this.repository.findMany(filter);

            return {
                offers,
                totalCount: count,
                limit: filter.limit || 50,
                offset: filter.offset || 0
            };

        } catch (error) {
            console.error('Failed to list offers:', error);
            throw new Error(`Service: Failed to list offers - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * List sell offers specifically (for marketplace)
     */
    async listSellOffers(filter: Omit<NFTOfferFilter, 'offer_type'> = {}): Promise<ListOffersResult> {
        try {
            const { offers, count } = await this.repository.findSellOffers(filter);

            return {
                offers,
                totalCount: count,
                limit: filter.limit || 50,
                offset: filter.offset || 0
            };

        } catch (error) {
            console.error('Failed to list sell offers:', error);
            throw new Error(`Service: Failed to list sell offers - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Expire old pending offers
     */
    async expireOldOffers(): Promise<number> {
        try {
            const expiredCount = await this.repository.expireOldOffers();
            console.log(`Expired ${expiredCount} old offers`);
            return expiredCount;
        } catch (error) {
            console.error('Failed to expire old offers:', error);
            throw new Error(`Service: Failed to expire offers - ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get offer statistics
     */
    async getOfferStats(): Promise<Record<string, number>> {
        try {
            return await this.repository.getStats();
        } catch (error) {
            console.error('Failed to get offer stats:', error);
            throw new Error(`Service: Failed to get stats - ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}