// XUMM Webhook endpoint to handle transaction status updates
// This endpoint receives notifications when users sign, reject, or when transactions expire

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { NFTOfferService } from "../_shared/nftOffer/index.ts";
import type { XummWebhookPayload, WebhookResponse } from "./type.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("xumm-webhook: starting function");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse the webhook payload from XUMM
    const payload = (await req.json()) as XummWebhookPayload;

    console.log('Received XUMM webhook:', JSON.stringify(payload, null, 2));

    const payloadId = payload.meta.uuid;
    if (!payloadId) {
      throw new Error("Missing payload UUID in webhook");
    }

    const offerService = new NFTOfferService();

    // Process the webhook update using the service
    const updatedOffer = await offerService.processWebhookUpdate(payload);

    console.log(`Updated offer ${updatedOffer.id} to status: ${updatedOffer.status}`);

    // Respond to XUMM webhook
    const response: WebhookResponse = {
      success: true,
      message: `Offer status updated to ${updatedOffer.status}`,
      offer_id: updatedOffer.id
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("xumm-webhook error:", err);

    const errorResponse: WebhookResponse = {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* Webhook Setup Instructions:

1. In your XUMM Developer Console (https://apps.xumm.dev), configure the webhook URL:
   - Production: https://your-project.supabase.co/functions/v1/xumm-webhook
   - Local development: Use ngrok or similar to expose local endpoint
     Example: https://abc123.ngrok.io/functions/v1/xumm-webhook

2. When creating XUMM payloads in your application, make sure to include webhook configuration:
   
   const payload = {
     txjson: yourTransaction,
     options: {
       webhook_url: 'https://your-project.supabase.co/functions/v1/xumm-webhook'
     }
   };

3. Test the webhook locally:
   
   curl -X POST 'http://127.0.0.1:54321/functions/v1/xumm-webhook' \
     -H 'Content-Type: application/json' \
     -d '{
       "meta": {
         "exists": true,
         "uuid": "test-payload-id-123",
         "signed": true,
         "cancelled": false,
         "expired": false
       },
       "payloadResponse": {
         "txid": "ABC123DEF456",
         "resolved_at": "2024-01-01T12:00:00.000Z",
         "account": "rTestAccount123",
         "dispatched_nodetype": "MAINNET",
         "dispatched_to": "wss://xrplcluster.com/",
         "environment_nodeuri": "wss://xrplcluster.com/",
         "environment_networkendpoint": "wss://xrplcluster.com/"
       }
     }'

Status Flow:
- pending: Initial state when offer is created
- signed: User signed the transaction in XUMM
- completed: Transaction was successfully submitted to XRPL
- rejected: User cancelled/rejected the transaction
- expired: 10-minute timeout reached without user action
- failed: Transaction signed but failed for some reason

*/