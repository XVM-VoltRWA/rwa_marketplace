// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client, Wallet } from "npm:xrpl@4.4.0";
import config from "../_shared/config/index.ts";
import { getNetworkUrl, getClientOptions, getClioUrl } from "../_shared/config/index.ts";
import { NFTOfferService } from "../_shared/nftOffer/index.ts";
import { withAuth } from "../_shared/middleware/auth.ts";
import type { JwtPayload } from "../_shared/auth/type.ts";
import type {
  CreateOfferRequest,
  CreateOfferResponse,
} from "./type.ts";
import XummService from "../_shared/xumm/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("create-offer: starting function");

const handler = async (req: Request, _ctx: { user?: JwtPayload }) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // typed input
  const body = (await req.json()) as CreateOfferRequest;
  const { nft_token_id, type, user_address, amount = "0", xumm_user_token: _xumm_user_token } = body;
  if (!nft_token_id || !type || !user_address) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: nft_token_id, type, user_address" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!["sell", "buy"].includes(type)) {
    return new Response(
      JSON.stringify({ error: "Invalid type: must be 'sell' or 'buy'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (type === "buy" && amount === "0") {
    return new Response(
      JSON.stringify({ error: "Amount must be non-zero for buy offers" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!config.BACKEND_WALLET_SEED)
    throw new Error("Backend wallet seed not configured");
  if (!config.XUMM_API_KEY)
    throw new Error(
      "XUMM API key/secret not configured; skipping XUMM payload creation"
    );

  if (!config.XUMM_API_SECRET)
    throw new Error(
      "XUMM API key/secret not configured; skipping XUMM payload creation"
    );

  const client = new Client(getNetworkUrl(config.NETWORK), getClientOptions());
  await client.connect();
  const backendWallet = Wallet.fromSeed(config.BACKEND_WALLET_SEED);
  const xummService = new XummService(
    config.XUMM_API_KEY,
    config.XUMM_API_SECRET
  );
  const offerService = new NFTOfferService();

  try {
    let owner: string | undefined;
    if (type === "buy") {
      const clioClient = new Client(getClioUrl(config.NETWORK), getClientOptions());
      const nftInfo = await clioClient.request({
        command: "nft_info",
        nft_id: nft_token_id
      });
      owner = nftInfo.result.owner;
      if (owner === user_address) {
        throw new Error("Cannot create buy offer for your own token");
      }
    }

    // Create XUMM payload for the user to sign using new helper
    const payload = await xummService.createNftOfferPayload(
      user_address,
      {
        nftTokenId: nft_token_id,
        amount: amount,
        type: type as 'sell' | 'buy',
        owner: owner,
        destination: backendWallet.address,
      },
      600
    );
    if (!payload) throw new Error("Failed to create XUMM payload");
    const enriched = xummService.enrichPayload(payload);

    if (enriched) {

      // Store the offer in the database using the service
      try {
        await offerService.createOffer({
          nft_token_id,
          offer_type: type as 'sell' | 'buy',
          user_address,
          amount,
          owner_address: owner,
          payload_id: enriched.uuid,
          deep_link: enriched.deepLink,
          pushed: enriched.pushed
        });
        console.log(`Stored offer in database with payload_id: ${enriched.uuid}`);
      } catch (dbError) {
        console.error('Failed to store offer in database:', dbError);
        // Continue with response even if DB storage fails
      }

      const response: CreateOfferResponse = {
        success: true,
        payload_id: enriched.uuid,
        deep_link: enriched.deepLink,
        message: payload.pushed
          ? "Offer creation request sent to your XUMM wallet. Please sign to create the offer."
          : "Scan the QR code with XUMM to sign and create the offer.",
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Failed to create XUMM payload");
    }
  } catch (err) {
    console.error("create-offer error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } finally {
    client.disconnect();
  }
};

// Export wrapped handler (optional auth)
Deno.serve(withAuth(handler, { required: true }));

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

Basic offer creation (requires QR scan or deep link):
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-offer' \
 --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJydzJldk5HM1ppTXhIVjFSVmlwNWJNRUMzZms0dmprclJOIiwiaWF0IjoxNzU4Mzc0OTM3LCJleHAiOjE3NTgzNzg1MzcsInB1c2hfdG9rZW4iOiI0ZGE0MjZlNy1hZGU4LTRiZGEtODIxZC0wOThjYWM2N2ZlYWMifQ.s8T3pxfV6fab8SQBXuZUfKn6HRsdFYtBS9I20jcZD8o' \
 --header 'Content-Type: application/json' \
  --data '{
"nft_token_id": "00080000F455ACD558EAD4E631A70EAAA11B5DA346A2971199191F3100A19F96",
"type": "sell",
"user_address": "rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN",
"amount": "1000000"
}'

curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-offer' \
 --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
 --header 'Content-Type: application/json' \
  --data '{
"nft_token_id": "00080000F455ACD558EAD4E631A70EAAA11B5DA346A29711CB04C62800A19F8D",
"type": "buy",
"user_address": "rpwDs3p5SgW6MZn5WJUsS4Cu7VX8a6uQ2D",
"amount": "1000000"
}'

With XUMM push notifications (sends directly to wallet):
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-offer' \
 --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
 --header 'Content-Type: application/json' \
 --data '{
"nft_token_id": "00080000...",
"type": "sell",
"user_address": "r...",
"amount": "1000000",
"xumm_user_token": "4da426e7-ade8-4bda-821d-098cac67feac" 
}'

Notes:
- nft_token_id: the NFTokenID to create offer for
- type: "sell" or "buy"
- user_address: the XRPL address of the user creating the offer
- amount: optional, defaults to "0" (in drops)
- xumm_user_token: optional, obtained from xumm-signin function
- When xumm_user_token is provided, the offer creation request is pushed directly to the user's XUMM wallet
- Without xumm_user_token, user must scan QR code or click deep link to sign and create the offer

To get xumm_user_token:
1. Call POST /xumm-signin to create sign-in request
2. User signs in with XUMM wallet
3. Call GET /xumm-signin?payload_id=<id> to retrieve user token
4. Use the user token for future push notifications

*/
