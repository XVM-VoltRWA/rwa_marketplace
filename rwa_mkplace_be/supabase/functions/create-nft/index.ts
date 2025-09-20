// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Client, Wallet } from "npm:xrpl@4.4.0";
import NftService from "../_shared/nft/service.ts";
import config from "../_shared/config/index.ts";
import { getExplorerBase, getNetworkUrl, getClientOptions } from "../_shared/config/index.ts";
import type {
  CreateNftRequest,
  CreateNftResponse,
  OfferAcceptance,
} from "./type.ts";
import XummService from "../_shared/xumm/index.ts";
import { withAuth } from "../_shared/middleware/auth.ts";
import type { JwtPayload } from "../_shared/auth/type.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("create-nft: starting function");

const handler = async (req: Request, ctx: { user?: JwtPayload }) => {
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
  const body: CreateNftRequest = await req.json();
  let { name, image_url, metadata, owner_address, xumm_user_token } = body;

  // Prefer push_token from authenticated session, if available
  if (!xumm_user_token && ctx.user && typeof ctx.user.push_token === "string") {
    xumm_user_token = ctx.user.push_token;
  }

  // If an authenticated session exists, ensure owner_address matches session
  if (ctx.user && owner_address && owner_address !== ctx.user.sub) {
    return new Response(
      JSON.stringify({ success: false, error: "owner_address does not match authenticated session wallet" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!name || !image_url) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: name, image_url" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!config.BACKEND_WALLET_SEED) throw new Error("Backend wallet seed not configured");
  if (!config.XUMM_API_KEY) throw new Error("XUMM API key/secret not configured; skipping XUMM payload creation");
  if (!config.XUMM_API_SECRET) throw new Error("XUMM API key/secret not configured; skipping XUMM payload creation");

  const client = new Client(getNetworkUrl(config.NETWORK), getClientOptions());
  await client.connect();
  const backendWallet = Wallet.fromSeed(config.BACKEND_WALLET_SEED);
  const nftService = new NftService(client, backendWallet);
  const xummService = new XummService(config.XUMM_API_KEY, config.XUMM_API_SECRET);

  try {
    // Mint using shared service
    const mintResult = await nftService.mintNft(backendWallet, {
      name,
      imageUrl: image_url,
      metadata: metadata || {},
    });
    const response: CreateNftResponse = {
      success: true,
      nft_token_id: mintResult.nftTokenId,
      mint_transaction_hash: mintResult.txHash,
      mint_explorer_link: `${getExplorerBase(config.NETWORK)}/transactions/${mintResult.txHash}`,
      network: config.NETWORK,
      minter_address: backendWallet.address,
    };

    // If owner_address provided, create a transfer offer and optionally build XUMM payload (edge handles XUMM SDK/QR)
    if (owner_address) {
      const giveNftToCreatorResult = await nftService.giveNftToCreator(
        mintResult.nftTokenId,
        owner_address,
        { amount: "0", flags: 1 },
        backendWallet
      );
      if (giveNftToCreatorResult) {
        response.transfer_offer_hash = giveNftToCreatorResult.transferTxHash;
        response.offer_index = giveNftToCreatorResult.offerIndex;
      }

      // If we have offer index and XUMM credentials in config, create a XUMM payload and QR here
      if (
        giveNftToCreatorResult &&
        giveNftToCreatorResult.offerIndex &&
        config.XUMM_API_KEY &&
        config.XUMM_API_SECRET
      ) {
        try {
          const payload = await xummService.createAcceptOfferPayload(owner_address, giveNftToCreatorResult.offerIndex);
          if (!payload) {
            throw new Error("Failed to create XUMM payload");
          }
          const enriched = await xummService.enrichPayload(payload);

          if (payload) {
            const acceptance: OfferAcceptance = {
              payload_id: payload.uuid,
              deep_link: enriched.deepLink,
              offer_index: giveNftToCreatorResult.offerIndex,
              pushed: payload.pushed,
              instruction: payload.pushed
                ? "A notification has been sent to your XUMM wallet. Please accept the NFT transfer."
                : "Scan this QR code with XUMM to accept the NFT transfer",
            };
            response.acceptance = acceptance;
            response.message = payload.pushed
              ? "NFT minted! Check your XUMM wallet to accept the transfer."
              : "NFT minted! Scan the QR code to accept the transfer to your wallet.";
          }
        } catch (err) {
          console.error("Failed to create XUMM payload:", err);
          response.message = "NFT minted and transfer offer created. Could not prepare XUMM payload.";
        }
      } else if (giveNftToCreatorResult && giveNftToCreatorResult.transferTxHash) {
        response.message = "NFT minted and transfer offer created. Accept the offer in XUMM manually.";
        response.manual_acceptance = {
          offer_index: giveNftToCreatorResult.offerIndex,
          instruction: "Open XUMM and look for pending NFT offers to accept this transfer",
        };
      }
    }

    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-nft error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    client.disconnect();
  }
};

// Export the wrapped handler (optional auth)
Deno.serve(withAuth(handler, { required: true }));

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

Basic NFT creation (requires QR scan or deep link):
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-nft' \
 --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJydzJldk5HM1ppTXhIVjFSVmlwNWJNRUMzZms0dmprclJOIiwiaWF0IjoxNzU4Mzc0OTM3LCJleHAiOjE3NTgzNzg1MzcsInB1c2hfdG9rZW4iOiI0ZGE0MjZlNy1hZGU4LTRiZGEtODIxZC0wOThjYWM2N2ZlYWMifQ.s8T3pxfV6fab8SQBXuZUfKn6HRsdFYtBS9I20jcZD8o' \
 --header 'Content-Type: application/json' \
 --data '{
"name": "mint test 123",
"image_url": "https://example.com/image.png",
"metadata": { "note": "mint test 123" },
"owner_address": "rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN"
}'


curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-nft' \
 --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
 --header 'Content-Type: application/json' \
 --data '{
"name": "mint test 123",
"image_url": "https://example.com/image.png",
"metadata": { "note": "mint test 123" },
"owner_address": "rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN"
}'


With XUMM push notifications (sends directly to wallet):
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-nft' \
 --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
 --header 'Content-Type: application/json' \
 --data '{
"name": "My NFT Name",
"image_url": "https://example.com/image.png",
"metadata": { "note": "mint test" },
"owner_address": "rpwDs3p5SgW6MZn5WJUsS4Cu7VX8a6uQ2D",
"xumm_user_token": "4da426e7-ade8-4bda-821d-098cac67feac" 
}'

Notes:
- owner_address: should not be backend wallet
- xumm_user_token: optional, obtained from xumm-signin function
- When xumm_user_token is provided, the NFT accept offer is pushed directly to the user's XUMM wallet
- Without xumm_user_token, user must scan QR code or click deep link to accept the NFT

To get xumm_user_token:
1. Call POST /xumm-signin to create sign-in request
2. User signs in with XUMM wallet
3. Call GET /xumm-signin?payload_id=<id> to retrieve user token
4. Use the user token for future push notifications

*/
