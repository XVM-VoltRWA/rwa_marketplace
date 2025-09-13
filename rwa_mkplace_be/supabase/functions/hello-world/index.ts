// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { greet } from "../_shared/test.ts";

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  try {
    // Allow only POST for this simple example
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      })
    }

    let payload: any
    try {
      payload = await req.json()
    } catch (e) {
      console.error("Invalid JSON payload:", e)
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { name } = payload ?? {}
    const data = {
      message: greet(name),
    }

    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
  } catch (err) {
    // Log full error for debugging, return safe JSON to client
    console.error("Runtime error in function:", err instanceof Error ? err.stack ?? err.message : err)
    const body = { error: err instanceof Error ? err.message : String(err) }
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/hello-world' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
