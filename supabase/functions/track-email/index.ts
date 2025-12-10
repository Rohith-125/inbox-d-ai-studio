import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const emailSendId = url.searchParams.get("emailSendId");
    const eventType = url.searchParams.get("type") || "open";

    if (!emailSendId) {
      console.log("No emailSendId provided");
      return new Response(TRACKING_PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          ...corsHeaders,
        },
      });
    }

    console.log(`Tracking ${eventType} event for email ${emailSendId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Record the event
    await fetch(
      `${supabaseUrl}/rest/v1/email_events`,
      {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_send_id: emailSendId,
          event_type: eventType,
          metadata: {
            user_agent: req.headers.get("user-agent"),
            timestamp: new Date().toISOString(),
          },
        }),
      }
    );

    // Update email_sends record
    if (eventType === "open") {
      await fetch(
        `${supabaseUrl}/rest/v1/email_sends?id=eq.${emailSendId}&opened_at=is.null`,
        {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            opened_at: new Date().toISOString(),
          }),
        }
      );
    } else if (eventType === "click") {
      await fetch(
        `${supabaseUrl}/rest/v1/email_sends?id=eq.${emailSendId}&clicked_at=is.null`,
        {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clicked_at: new Date().toISOString(),
          }),
        }
      );
    }

    // Return tracking pixel
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in track-email function:", error);
    // Still return the pixel even on error
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
