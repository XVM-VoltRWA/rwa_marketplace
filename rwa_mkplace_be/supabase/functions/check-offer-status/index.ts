// Function to check the current status of an NFT offer
// Can be used by frontend to poll for status updates

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { NFTOfferService } from "../_shared/nftOffer/index.ts";
import type { CheckOfferStatusRequest, CheckOfferStatusResponse } from "./type.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

console.log("check-offer-status: starting function");

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
        let payload_id: string | undefined;
        let offer_id: string | undefined;

        if (req.method === "GET") {
            const url = new URL(req.url);
            payload_id = url.searchParams.get("payload_id") || undefined;
            offer_id = url.searchParams.get("offer_id") || undefined;
        } else {
            const body = (await req.json()) as CheckOfferStatusRequest;
            payload_id = body.payload_id;
            offer_id = body.offer_id;
        }

        if (!payload_id && !offer_id) {
            return new Response(
                JSON.stringify({ error: "Missing payload_id or offer_id parameter" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const offerService = new NFTOfferService();

        // Get the offer and check/sync status with XUMM
        let result;
        if (payload_id) {
            result = await offerService.checkAndSyncOfferStatus(payload_id);
        } else if (offer_id) {
            const offer = await offerService.getOfferById(offer_id);
            if (!offer) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: "Offer not found"
                    }),
                    {
                        status: 404,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            }
            result = await offerService.checkAndSyncOfferStatus(offer.payload_id);
        }

        if (!result) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Offer not found"
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Return the offer status (updated or current)
        const response: CheckOfferStatusResponse = {
            success: true,
            offer: {
                id: result.offer.id!,
                nft_token_id: result.offer.nft_token_id,
                offer_type: result.offer.offer_type,
                user_address: result.offer.user_address,
                amount: result.offer.amount,
                status: result.offer.status,
                payload_id: result.offer.payload_id,
                tx_hash: result.offer.tx_hash,
                created_at: result.offer.created_at!,
                updated_at: result.offer.updated_at!,
                signed_at: result.offer.signed_at,
                completed_at: result.offer.completed_at,
                error_message: result.offer.error_message,
            }
        };

        if (result.updated) {
            console.log(`Status updated for offer ${result.offer.id} to: ${result.offer.status}`);
        }

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("check-offer-status error:", err);

        const errorResponse: CheckOfferStatusResponse = {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

/* To invoke locally:

1. Check status by payload_id (GET request):
   curl 'http://127.0.0.1:54321/functions/v1/check-offer-status?payload_id=abc-123-def'

2. Check status by offer_id (GET request):
   curl 'http://127.0.0.1:54321/functions/v1/check-offer-status?offer_id=550e8400-e29b-41d4-a716-446655440000'

3. Check status by payload_id (POST request):
   curl -X POST 'http://127.0.0.1:54321/functions/v1/check-offer-status' \
     -H 'Content-Type: application/json' \
     -d '{"payload_id": "abc-123-def"}'

4. Check status by offer_id (POST request):
   curl -X POST 'http://127.0.0.1:54321/functions/v1/check-offer-status' \
     -H 'Content-Type: application/json' \
     -d '{"offer_id": "550e8400-e29b-41d4-a716-446655440000"}'

Response format:
{
  "success": true,
  "offer": {
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
}

Notes:
- This function will automatically check XUMM for status updates if the offer is still pending
- Status values: pending, signed, rejected, expired, completed, failed
- Use this endpoint for polling or real-time status checks in your frontend
- The function updates the database if it detects a status change from XUMM

*/