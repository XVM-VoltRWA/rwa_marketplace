// Utility functions for the application
// Note: NFT offer operations have been moved to the NFTOfferService class
// in the _shared/nftOffer/ folder for better organization.

import { createClient } from "jsr:@supabase/supabase-js@2";

// Create Supabase client for server-side operations
export function createSupabaseClient() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    return createClient(supabaseUrl, supabaseServiceKey);
}