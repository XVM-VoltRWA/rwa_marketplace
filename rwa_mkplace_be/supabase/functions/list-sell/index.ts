// Function to retrieve NFT sell offers with filtering and pagination
// Specifically for marketplace listings and sell offer history

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { NFTOfferService } from "../_shared/nftOffer/index.ts";
import type { ListSellRequest, ListSellResponse, SellOfferData } from "./type.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("list-sell: starting function");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let filters: ListSellRequest = {};

    if (req.method === "GET") {
      const url = new URL(req.url);
      filters = {
        user_address: url.searchParams.get("user_address") || undefined,
        nft_token_id: url.searchParams.get("nft_token_id") || undefined,
        status: (url.searchParams.get("status") as 'pending' | 'signed' | 'rejected' | 'expired' | 'completed' | 'failed') || undefined,
        limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 50,
        offset: url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : 0,
      };
    } else {
      const body = (await req.json()) as ListSellRequest;
      filters = {
        ...body,
        limit: body.limit || 50,
        offset: body.offset || 0,
      };
    }

    // Validate limit
    if (filters.limit! > 100) {
      filters.limit = 100; // Cap at 100 to prevent excessive queries
    }

    const offerService = new NFTOfferService();

    // Get sell offers using the service
    const result = await offerService.listSellOffers(filters);

    // Map the results to the response format
    const mappedOffers: SellOfferData[] = result.offers.map(offer => ({
      id: offer.id!,
      nft_token_id: offer.nft_token_id,
      offer_type: 'sell' as const,
      user_address: offer.user_address,
      amount: offer.amount,
      owner_address: offer.owner_address,
      status: offer.status,
      payload_id: offer.payload_id,
      tx_hash: offer.tx_hash,
      created_at: offer.created_at!,
      updated_at: offer.updated_at!,
      signed_at: offer.signed_at,
      completed_at: offer.completed_at,
      error_message: offer.error_message,
      deep_link: offer.deep_link,
      qr_code: offer.qr_code,
      pushed: offer.pushed,
    }));

    const response: ListSellResponse = {
      success: true,
      offers: mappedOffers,
      total_count: result.totalCount,
      limit: result.limit,
      offset: result.offset,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("list-sell error:", err);

    const errorResponse: ListSellResponse = {
      success: false,
      offers: [],
      total_count: 0,
      limit: 0,
      offset: 0,
      error: err instanceof Error ? err.message : String(err),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

1. Get all sell offers (GET request):
   curl 'http://127.0.0.1:54321/functions/v1/list-sell'

2. Get sell offers for a specific user (GET request):
   curl 'http://127.0.0.1:54321/functions/v1/list-sell?user_address=rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN'

3. Get sell offers for a specific NFT (GET request):
   curl 'http://127.0.0.1:54321/functions/v1/list-sell?nft_token_id=00080000F455ACD558EAD4E631A70EAAA11B5DA346A29711CB04C62800A19F8D'

4. Get marketplace listings (pending sell offers):
   curl 'http://127.0.0.1:54321/functions/v1/list-sell?status=pending'

5. Get completed sell offers:
   curl 'http://127.0.0.1:54321/functions/v1/list-sell?status=completed'

6. Get sell offers with pagination:
   curl 'http://127.0.0.1:54321/functions/v1/list-sell?limit=10&offset=0'

7. Complex query (POST request):
   curl -X POST 'http://127.0.0.1:54321/functions/v1/list-sell' \
     -H 'Content-Type: application/json' \
     -d '{
       "user_address": "rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN",
       "status": "completed",
       "limit": 20,
       "offset": 0
     }'

Response format:
{
  "success": true,
  "offers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nft_token_id": "00080000F455ACD558EAD4E631A70EAAA11B5DA346A29711CB04C62800A19F8D",
      "offer_type": "sell",
      "user_address": "rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN",
      "amount": "1000000",
      "status": "completed",
      "payload_id": "abc-123-def",
      "tx_hash": "A1B2C3D4E5F6...",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:05:00.000Z",
      "signed_at": "2024-01-01T12:04:30.000Z",
      "completed_at": "2024-01-01T12:05:00.000Z"
    }
  ],
  "total_count": 1,
  "limit": 50,
  "offset": 0
}

Filter Parameters:
- user_address: Filter by the user who created the sell offer
- nft_token_id: Filter by specific NFT token
- status: Filter by offer status (pending, signed, rejected, expired, completed, failed)
- limit: Number of results to return (max 100, default 50)
- offset: Number of results to skip for pagination (default 0)

Use Cases:
- Show marketplace listings: status=pending (active sell offers available for purchase)
- Show user's sell history: filter by user_address
- Show all sell offers for an NFT: filter by nft_token_id
- Show completed sales: filter by status=completed
- Show expired/failed listings: filter by status=expired or status=failed
- Implement pagination for large result sets using limit and offset

Note: This endpoint only returns sell offers. For buy offers or mixed results, use a different endpoint.

*/