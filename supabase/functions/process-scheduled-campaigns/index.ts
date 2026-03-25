import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This function is called by pg_cron, no auth header required
  // It uses service role key internally for all database operations

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find campaigns that are scheduled and due to be sent
    const now = new Date().toISOString();
    const { data: scheduledCampaigns, error: fetchError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (fetchError) {
      throw fetchError;
    }

    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled campaigns to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const campaign of scheduledCampaigns) {
      try {
        // Get all customers for this user
        const { data: customers, error: customersError } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", campaign.user_id);

        if (customersError) throw customersError;

        if (!customers || customers.length === 0) {
          // No customers, mark as sent
          await supabase
            .from("campaigns")
            .update({ status: "sent", sent_at: now })
            .eq("id", campaign.id);
          
          results.push({ campaignId: campaign.id, status: "sent", sent: 0 });
          continue;
        }

        // Get user's profile for sender name
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", campaign.user_id)
          .maybeSingle();

        const senderName = profile?.username || "Inbox'd";

        // Update campaign status to sending
        await supabase
          .from("campaigns")
          .update({ status: "sending" })
          .eq("id", campaign.id);

        // Call the send-campaign-emails function
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-campaign-emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            campaignId: campaign.id,
            subject: campaign.subject,
            body: campaign.body,
            customerIds: customers.map(c => c.id),
            fromName: senderName,
            ctaText: campaign.cta_text,
            ctaLink: campaign.cta_link,
            imageUrl: campaign.image_url,
          }),
        });

        const sendResult = await sendResponse.json();
        results.push({
          campaignId: campaign.id,
          status: "sent",
          ...sendResult,
        });
      } catch (campaignError: any) {
        console.error(`Error processing campaign ${campaign.id}:`, campaignError);
        results.push({
          campaignId: campaign.id,
          status: "error",
          error: campaignError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-campaigns:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
