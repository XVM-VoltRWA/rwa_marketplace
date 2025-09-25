import type { JwtPayload } from "../auth/type.ts";
import { AuthService } from "../auth/service.ts";

export type HandlerWithCtx = (req: Request, ctx: { user: JwtPayload }) => Promise<Response> | Response;

const authSvc = new AuthService();

/**
 * withAuth: Higher-order wrapper that verifies Authorization Bearer JWT and
 * passes decoded `JwtPayload` as `ctx.user` to the wrapped handler.
 *
 * opts.required: when true, reject requests without a valid token (401).
 */
export function withAuth(handler: HandlerWithCtx) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    return async (req: Request): Promise<Response> => {
        // Handle CORS preflight
        if (req.method === "OPTIONS") {
            return new Response("ok", { headers: corsHeaders });
        }

        try {
            const authHeader = req.headers.get("authorization") || "";
            const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.split(" ")[1] : null;

            if (!token) {
                return new Response(JSON.stringify({ success: false, error: "Missing Authorization token" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            // Here we have a token, verify it
            const payload = await authSvc.verifySessionJwt(token);
            // If a token was provided but verification failed, treat this as unauthenticated.
            if (!payload) {
                return new Response(JSON.stringify({ success: false, error: "Invalid or expired token" }), {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }

            return await Promise.resolve(handler(req, { user: payload }));
        } catch (err) {
            console.error("withAuth error:", err);
            return new Response(JSON.stringify({ success: false, error: "Auth error" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
    };
}
