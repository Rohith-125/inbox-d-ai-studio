import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, tone, ctaText, ctaLink, imageDescription }: GenerateEmailRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const toneDescriptions: Record<string, string> = {
      professional: "formal, business-appropriate, and respectful",
      friendly: "warm, conversational, and approachable with occasional emojis",
      urgent: "time-sensitive, action-driven, and compelling with urgency markers",
    };

    let prompt = `Generate a professional marketing email based on the following:

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

    prompt += `

Requirements:
- Use {{name}} placeholder for personalization
- Keep the email concise (150-250 words)
- Include a clear call-to-action
- Make it engaging and relevant to the subject
- If CTA is provided, mention the button/link naturally
- If image is provided, describe how it relates to the offer
- End with a professional signature

Only return the email body text, no subject line.`;

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
