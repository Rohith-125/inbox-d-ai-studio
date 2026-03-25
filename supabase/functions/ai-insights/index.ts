import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch all data for analysis
    const [campaignsRes, customersRes, emailSendsRes] = await Promise.all([
      supabase.from("campaigns").select("*"),
      supabase.from("customers").select("id, tags, created_at", { count: "exact" }),
      supabase.from("email_sends").select("id, campaign_id, status, opened_at, clicked_at, sent_at, created_at"),
    ]);

    const campaigns = campaignsRes.data || [];
    const customers = customersRes.data || [];
    const customerCount = customersRes.count || 0;
    const emailSends = emailSendsRes.data || [];

    // Build stats summary for AI
    const totalSent = emailSends.filter(e => e.status === "sent").length;
    const totalOpens = emailSends.filter(e => e.opened_at).length;
    const totalClicks = emailSends.filter(e => e.clicked_at).length;
    const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0";
    const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0";

    // Performance by tone
    const toneStats: Record<string, { sent: number; opens: number; clicks: number }> = {};
    for (const campaign of campaigns) {
      const tone = campaign.tone || "professional";
      if (!toneStats[tone]) toneStats[tone] = { sent: 0, opens: 0, clicks: 0 };
      const sends = emailSends.filter(e => e.campaign_id === campaign.id);
      toneStats[tone].sent += sends.filter(e => e.status === "sent").length;
      toneStats[tone].opens += sends.filter(e => e.opened_at).length;
      toneStats[tone].clicks += sends.filter(e => e.clicked_at).length;
    }

    // Campaign frequency
    const sentCampaigns = campaigns.filter(c => c.status === "sent" && c.sent_at);
    const draftCount = campaigns.filter(c => c.status === "draft").length;
    const scheduledCount = campaigns.filter(c => c.status === "scheduled").length;

    const dataSummary = `
Email Marketing Dashboard Stats:
- Total subscribers: ${customerCount}
- Total campaigns created: ${campaigns.length} (${sentCampaigns.length} sent, ${draftCount} drafts, ${scheduledCount} scheduled)
- Total emails sent: ${totalSent}
- Total opens: ${totalOpens} (${openRate}% open rate)
- Total clicks: ${totalClicks} (${clickRate}% click-through rate)
- Performance by tone: ${JSON.stringify(toneStats)}
- Most recent campaign sent: ${sentCampaigns.length > 0 ? sentCampaigns.sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime())[0].sent_at : "None"}
    `.trim();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an email marketing analytics expert. Analyze the provided stats and return exactly 3-5 concise, actionable insights as a JSON array. Each insight should have: "title" (short, max 6 words), "description" (1-2 sentences, actionable), "type" (one of: "success", "warning", "tip", "info"). Focus on what matters: engagement rates, tone effectiveness, sending patterns, growth opportunities. If there's very little or no data, give helpful getting-started tips. Return ONLY the JSON array, no markdown.`,
          },
          { role: "user", content: dataSummary },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse the JSON from the AI response
    let insights;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      insights = [{ title: "Analysis Complete", description: "Your email marketing is off to a great start. Keep sending campaigns to see deeper insights.", type: "info" }];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
