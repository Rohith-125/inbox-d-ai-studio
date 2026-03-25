import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateEmailRequest {
  subject: string;
  tone: "professional" | "friendly" | "urgent";
  ctaText?: string;
  ctaLink?: string;
  imageDescription?: string;
  senderName?: string;
  campaignType?: "marketing" | "product_showcase" | "feedback_form";
  productName?: string;
  productDescription?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("Authenticated user:", user.id);

    const { subject, tone, ctaText, ctaLink, imageDescription, senderName, campaignType, productName, productDescription }: GenerateEmailRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const toneDescriptions: Record<string, string> = {
      professional: "formal, business-appropriate, and respectful",
      friendly: "warm, conversational, and approachable with occasional emojis",
      urgent: "time-sensitive, action-driven, and compelling with urgency markers",
      benefit_driven: "focused on outcomes, value propositions, and tangible benefits the reader will gain",
      announcement: "exciting, newsworthy, and celebratory — perfect for launches and big reveals",
    };

    let prompt = "";

    if (campaignType === "feedback_form") {
      prompt = `Generate a feedback/review request email for a product.

Subject Line: ${subject}
Tone: ${toneDescriptions[tone] || "professional"}
${productName ? `Product Name: ${productName}` : ""}
${productDescription ? `Product Description: ${productDescription}` : ""}

IMPORTANT — Use this structure:

**GREETING**: Address the customer warmly using {{name}} placeholder.

**CONTEXT** (1-2 sentences): Remind them about the product they purchased/used. Be specific if product details are given.

**THE ASK** (1-2 sentences): Ask for their honest feedback or review. Make it feel easy and quick — mention it takes only 1-2 minutes. Explain why their feedback matters (helps improve, helps other customers decide, etc.).

**CLOSING**: Thank them for their time and support.

Additional Requirements:
- Keep the total email under 120 words
- Use {{name}} placeholder for personalization
- If CTA is provided, DO NOT include the link in the text body — the CTA button will be added separately
- End with a professional signature signed by "${senderName || "Inbox'd"}"

Only return the email body text, no subject line. Do not include any links or URLs in the body text.`;

    } else if (campaignType === "product_showcase") {
      prompt = `Generate a product showcase email to highlight and promote a product.

Subject Line: ${subject}
Tone: ${toneDescriptions[tone] || "professional"}
${productName ? `Product Name: ${productName}` : ""}
${productDescription ? `Product Description: ${productDescription}` : ""}

IMPORTANT — Use this structure:

**THE HOOK** (1 sentence): Open with a bold statement about the product that grabs attention. Address a need or desire.

**PRODUCT HIGHLIGHT** (2-3 sentences): Showcase key features, benefits, or what makes this product special. Use **bold** on the single most compelling selling point. If product details are given, weave them in naturally.

**SOCIAL PROOF / URGENCY** (1 sentence): Add a trust element — limited availability, customer love, or a compelling reason to act now.

**THE BRIDGE** (1 sentence): Connect the value directly to the CTA.

Additional Requirements:
- Use {{name}} placeholder for personalization in the hook
- Keep the total email under 120 words
- If CTA is provided, DO NOT include the link in the text body — the CTA button will be added separately
- If image is provided, describe how it relates to the product
- End with a professional signature signed by "${senderName || "Inbox'd"}"

Only return the email body text, no subject line. Do not include any links or URLs in the body text.`;

    } else {
      // Default marketing campaign
      prompt = `Generate a marketing email based on the following:

Subject Line: ${subject}
Tone: ${toneDescriptions[tone] || "professional"}`;

      if (ctaText && ctaLink) {
        prompt += `
Call-to-Action Button Text: ${ctaText}
Call-to-Action Link: ${ctaLink}`;
      }

      if (imageDescription) {
        prompt += `
Image/Product Description: ${imageDescription}
Please reference this image/product naturally in the email body.`;
      }

      const signatureName = senderName || "Inbox'd";

      prompt += `

IMPORTANT — Use this exact three-part structure:

**THE HOOK** (1 sentence): Open with a bold, specific statement that addresses a pain point or a surprising benefit. Example: "Your morning routine is costing you 2 hours."

**THE BODY** (2-3 short sentences): Keep it scannable. Use **bold** on the single most important value proposition. People scan emails — they don't read them.

**THE BRIDGE** (1 sentence): Connect the value directly to the CTA. Example: "Here is the tool to win that time back."

Additional Requirements:
- Use {{name}} placeholder for personalization in the hook
- Keep the total email under 100 words
- If CTA is provided, DO NOT include the link in the text body — the CTA button will be added separately
- If image is provided, describe how it relates to the offer
- End with a professional signature signed by "${signatureName}"

Only return the email body text, no subject line. Do not include any links or URLs in the body text.`;
    }

    console.log("Generating email with prompt:", prompt);

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
            content: "You are an expert email copywriter who creates engaging marketing emails. Write in the exact tone specified. Be creative but professional." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate email content");
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    console.log("Generated email content successfully");

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-email function:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
