import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";
import type {
    NFTOfferData,
    NFTOfferFilter,
    NFTOfferUpdate,
    FindManyResult
} from "./type.ts";/**
 * Repository class for NFT offer database operations
 * Handles all CRUD operations for the nft_offers table
 */
export class NFTOfferRepository {
    private supabase: SupabaseClient;

    constructor() {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

    /**
     * Create a new NFT offer in the database
     */
    async create(offerData: Omit<NFTOfferData, 'id' | 'created_at' | 'updated_at'>): Promise<NFTOfferData> {
        const { data, error } = await this.supabase
            .from('nft_offers')
            .insert([{
                nft_token_id: offerData.nft_token_id,
                offer_type: offerData.offer_type,
                user_address: offerData.user_address,
                amount: offerData.amount,
                owner_address: offerData.owner_address,
                payload_id: offerData.payload_id,
                deep_link: offerData.deep_link,
                qr_code: offerData.qr_code,
                pushed: offerData.pushed || false,
                status: offerData.status || 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating NFT offer:', error);
            throw new Error(`Failed to create offer: ${error.message}`);
        }

        return data;
    }

    /**
     * Find offer by payload ID
     */
    async findByPayloadId(payloadId: string): Promise<NFTOfferData | null> {
        const { data, error } = await this.supabase
            .from('nft_offers')
            .select('*')
            .eq('payload_id', payloadId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No rows found
            }
            console.error('Error finding offer by payload ID:', error);
            throw new Error(`Failed to find offer: ${error.message}`);
        }

        return data;
    }

    /**
     * Find offer by ID
     */
    async findById(id: string): Promise<NFTOfferData | null> {
        const { data, error } = await this.supabase
            .from('nft_offers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No rows found
            }
            console.error('Error finding offer by ID:', error);
            throw new Error(`Failed to find offer: ${error.message}`);
        }

        return data;
    }

    /**
     * Update offer by payload ID
     */
    async updateByPayloadId(payloadId: string, updates: NFTOfferUpdate): Promise<NFTOfferData> {
        const { data, error } = await this.supabase
            .from('nft_offers')
            .update(updates)
            .eq('payload_id', payloadId)
            .select()
            .single();

        if (error) {
            console.error('Error updating offer:', error);
            throw new Error(`Failed to update offer: ${error.message}`);
        }

        return data;
    }

    /**
     * Find offers with filters and pagination
     */
    async findMany(filter: NFTOfferFilter = {}): Promise<FindManyResult> {
        let query = this.supabase
            .from('nft_offers')
            .select('*', { count: 'exact' });

        // Apply filters
        if (filter.user_address) {
            query = query.eq('user_address', filter.user_address);
        }

        if (filter.nft_token_id) {
            query = query.eq('nft_token_id', filter.nft_token_id);
        }

        if (filter.offer_type) {
            query = query.eq('offer_type', filter.offer_type);
        }

        if (filter.status) {
            query = query.eq('status', filter.status);
        }

        // Apply pagination and ordering
        const limit = Math.min(filter.limit || 50, 100); // Cap at 100
        const offset = filter.offset || 0;

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error finding offers:', error);
            throw new Error(`Failed to find offers: ${error.message}`);
        }

        return {
            offers: data || [],
            count: count || 0
        };
    }

    /**
     * Find sell offers with pending status (for marketplace listings)
     */
    async findSellOffers(filter: Omit<NFTOfferFilter, 'offer_type'> = {}): Promise<FindManyResult> {
        return await this.findMany({
            ...filter,
            offer_type: 'sell'
        });
    }

    /**
     * Mark expired offers
     */
    async expireOldOffers(): Promise<number> {
        const { data, error } = await this.supabase
            .from('nft_offers')
            .update({
                status: 'expired',
                updated_at: new Date().toISOString()
            })
            .eq('status', 'pending')
            .lt('payload_expires_at', new Date().toISOString())
            .select();

        if (error) {
            console.error('Error expiring old offers:', error);
            throw new Error(`Failed to expire offers: ${error.message}`);
        }

        return data?.length || 0;
    }

    /**
     * Get offer statistics
     */
    async getStats(): Promise<Record<string, number>> {
        const { data, error } = await this.supabase
            .from('nft_offers')
            .select('status')
            .eq('status', 'pending')
            .eq('status', 'completed')
            .eq('status', 'failed');

        if (error) {
            console.error('Error getting stats:', error);
            throw new Error(`Failed to get stats: ${error.message}`);
        }

        const stats: Record<string, number> = {};
        data?.forEach(offer => {
            stats[offer.status] = (stats[offer.status] || 0) + 1;
        });

        return stats;
    }
}