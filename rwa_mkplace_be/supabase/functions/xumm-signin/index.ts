/**
 * XUMM Sign-In Endpoint
 *
 * Creates a sign-in request for XUMM wallet and returns user token after signing
 *
 * Method: POST/GET
 *
 * POST Input:
 * {
 *   wallet_address?: string  // Optional: specific wallet to sign in with
 * }
 *
 * GET Input:
 * ?payload_id=xxx  // Check status and get user token
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import XummService from "../_shared/xumm/index.ts";
import config from "../_shared/config/index.ts";
import { AuthService } from "../_shared/auth/service.ts";
import type { SignInRequest, SignInResponse, SignInStatusResponse } from "./type.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("xumm-signin: starting function");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Helper to return JSON responses with CORS + content-type
  const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const errorResponse = (message: string, statusCode = 400, extras: Record<string, unknown> = {}) =>
    jsonResponse({ success: false, message, error: message, ...extras }, statusCode);

  const requireXummConfig = () => {
    if (!config.XUMM_API_KEY || !config.XUMM_API_SECRET) {
      throw new Error("XUMM credentials not configured");
    }
  };

  const createServices = () => {
    requireXummConfig();
    const xummService = new XummService(config.XUMM_API_KEY!, config.XUMM_API_SECRET!);
    const auth = new AuthService();
    return { xummService, auth };
  };

  // GET request to check payload status and retrieve user token
  if (req.method === "GET") {
    const payloadId = url.searchParams.get("payload_id");

    if (!payloadId) {
      return errorResponse("Missing payload_id parameter", 400, { payload_id: "" });
    }

    try {
      const { xummService, auth } = createServices();
      const status = await xummService.getPayloadStatus(payloadId);

      console.log("Payload status:", status);

      const response: SignInStatusResponse = {
        success: true,
        payload_id: payloadId,
        signed: status.signed,
        status: status.resolved ? "resolved" : "pending",
        hex: status.hex,
        message: "",
      };

      if (status.signed && status.user_token && status.wallet_address) {
        response.user_token = status.user_token;
        response.wallet_address = status.wallet_address;
        response.message = "Sign-in successful!";

        try {
          const jwt = await auth.createSessionJwt(status.wallet_address, undefined, status.user_token);
          response.jwt = jwt;
        } catch (err) {
          console.error("Failed to generate JWT:", err);
        }
      } else if (status.expired) {
        response.expired = true;
        response.message = "Sign-in request expired. Please create a new sign-in request.";
      } else if (status.cancelled) {
        response.cancelled = true;
        response.message = "Sign-in request was cancelled.";
      } else {
        response.message = "Waiting for sign-in...";
      }

      return jsonResponse(response);
    } catch (error) {
      console.error("Error checking payload:", error);
      return errorResponse("Failed to check payload status", 500, { payloadId });
    }
  }

  // POST request to create sign-in payload
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body: SignInRequest = await req.json();
    const { wallet_address } = body;

    if (!wallet_address) {
      return errorResponse("Missing required field: wallet_address", 400);
    }

    const { xummService } = createServices();
    const payload = await xummService.createSignInPayload(wallet_address);
    console.log("Created payload:", payload);
    if (!payload) {
      throw new Error("Failed to create XUMM payload");
    }
    const enriched = xummService.enrichPayload(payload);
    console.log("Enriched payload:", enriched);

    const response: SignInResponse = {
      success: true,
      payload_id: enriched.uuid,
      deep_link: enriched.deepLink,
      message: "Scan the QR code with XUMM to sign in",
      next_step: `After signing, call GET /xumm-signin?payload_id=${enriched.uuid} to retrieve your user token`,
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error creating sign-in:", error);
    const message = error instanceof Error ? error.message : "Failed to create sign-in";
    return errorResponse("Failed to create sign-in", 500, { error: message });
  }
});

/**
 * XUMM payload creation and status checking service.
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/xumm-signin' \
  --header 'Content-Type: application/json' \
  --data '{
    "wallet_address": "rw2evNG3ZiMxHV1RVip5bMEC3fk4vjkrRN"
  }'


  curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/xumm-signin?payload_id=6a19ab9b-3ab9-45e6-8dac-daded49a2f52' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
 */