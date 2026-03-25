import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriberData {
  id: string;
  name: string;
  email: string;
  cart_status: string | null;
  last_purchase_date: string | null;
  total_purchases: number | null;
  engagement_level: string | null;
  tags: string[] | null;
}

interface PersonalizeRequest {
  subscribers: SubscriberData[];
  tone: string;
  senderName?: string;
  productContext?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subscribers, tone, senderName, productContext }: PersonalizeRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const toneDescriptions: Record<string, string> = {
      professional: "formal, business-appropriate",
      friendly: "warm, conversational with occasional emojis",
      urgent: "time-sensitive, action-driven",
      benefit_driven: "focused on value propositions",
      announcement: "exciting and celebratory",
    };

    const results: Array<{ subscriberId: string; subject: string; body: string }> = [];

    for (const sub of subscribers) {
      const behaviorContext = buildBehaviorContext(sub);

      const prompt = `Generate a personalized marketing email for a specific subscriber based on their behavior data.

Subscriber Info:
- Name: ${sub.name}
- Email: ${sub.email}
${behaviorContext}
${productContext ? `Product/Brand Context: ${productContext}` : ""}

Tone: ${toneDescriptions[tone] || "professional"}

IMPORTANT RULES:
- Analyze the subscriber's behavior data and craft a UNIQUE email that directly addresses their situation
- If cart is abandoned: focus on recovering the cart, create urgency
- If cart is empty: suggest products, highlight new arrivals or best sellers
- If cart is active: encourage checkout, mention benefits
- If engagement is "inactive": re-engage with special offer or "we miss you" angle
- If engagement is "vip": exclusive access, loyalty rewards, premium treatment
- If engagement is "new": welcome, onboarding, first-purchase incentive
- If they have recent purchases: cross-sell, ask for review, thank them
- Keep under 120 words
- Use the subscriber's name naturally
- Sign off as "${senderName || "Inbox'd"}"

Return ONLY a JSON object with two fields:
- "subject": a compelling subject line tailored to this subscriber's behavior
- "body": the email body text (no HTML, just plain text with line breaks)

Return raw JSON only, no markdown fences.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an expert email personalization AI. You analyze subscriber behavior data and generate highly personalized email content. Always return valid JSON.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI error for ${sub.email}:`, response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        continue;
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";
      
      // Strip markdown fences if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(content);
        results.push({
          subscriberId: sub.id,
          subject: parsed.subject || "Personalized offer for you",
          body: parsed.body || content,
        });
      } catch {
        results.push({
          subscriberId: sub.id,
          subject: "A personalized message for you",
          body: content,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-personalized-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildBehaviorContext(sub: SubscriberData): string {
  const lines: string[] = [];

  if (sub.cart_status) {
    lines.push(`- Cart Status: ${sub.cart_status}`);
  }
  if (sub.engagement_level) {
    lines.push(`- Engagement Level: ${sub.engagement_level}`);
  }
  if (sub.total_purchases !== null && sub.total_purchases !== undefined) {
    lines.push(`- Total Purchases: ${sub.total_purchases}`);
  }
  if (sub.last_purchase_date) {
    const days = Math.floor((Date.now() - new Date(sub.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24));
    lines.push(`- Last Purchase: ${days} days ago`);
  }
  if (sub.tags && sub.tags.length > 0) {
    lines.push(`- Tags: ${sub.tags.join(", ")}`);
  }

  return lines.length > 0 ? `\nBehavior Data:\n${lines.join("\n")}` : "\nNo behavior data available.";
}
