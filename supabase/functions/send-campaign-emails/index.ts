import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaignId: string;
  subject: string;
  body: string;
  customerIds: string[];
  fromEmail?: string;
  fromName?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { campaignId, subject, body, customerIds, fromEmail, fromName, ctaText, ctaLink, imageUrl }: SendCampaignRequest = await req.json();

    console.log(`Starting campaign ${campaignId} with ${customerIds.length} recipients`);

    // Fetch customers using REST API
    const customersResponse = await fetch(
      `${supabaseUrl}/rest/v1/customers?id=in.(${customerIds.join(",")})&select=id,name,email`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    const customers = await customersResponse.json();

    if (!customers || customers.length === 0) {
      throw new Error("No customers found");
    }

    console.log(`Found ${customers.length} customers to email`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails to each customer
    for (const customer of customers) {
      try {
        // Create email send record
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/email_sends`,
          {
            method: "POST",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=representation",
            },
            body: JSON.stringify({
              campaign_id: campaignId,
              customer_id: customer.id,
              status: "pending",
            }),
          }
        );

        const emailSendData = await insertResponse.json();
        const emailSend = Array.isArray(emailSendData) ? emailSendData[0] : emailSendData;

        if (!emailSend?.id) {
          console.error(`Error creating email send record for ${customer.email}`);
          results.failed++;
          results.errors.push(`Failed to create record for ${customer.email}`);
          continue;
        }

        // Personalize email body
        const personalizedBody = body
          .replace(/\{\{name\}\}/g, customer.name || "Valued Customer")
          .replace(/\{\{email\}\}/g, customer.email);

        // Create tracking pixel URL
        const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email?emailSendId=${emailSend.id}&type=open`;
        
        // Build image HTML if provided
        const imageHtml = imageUrl ? `
          <div style="margin: 20px 0; text-align: center;">
            <img src="${imageUrl}" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: 8px;" />
          </div>
        ` : '';

        // Build CTA button HTML if provided
        const ctaHtml = ctaText && ctaLink ? `
          <div style="margin: 30px 0; text-align: center;">
            <a href="${ctaLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">${ctaText}</a>
          </div>
        ` : '';
        
        // Add tracking pixel to email
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${imageHtml}
            ${personalizedBody.replace(/\n/g, "<br>")}
            ${ctaHtml}
          </div>
          <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
        `;

        // Send email via Resend
        const senderName = fromName || "Inbox'd";
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail ? `${senderName} <${fromEmail}>` : `${senderName} <onboarding@resend.dev>`,
            to: [customer.email],
            subject: subject.replace(/\{\{name\}\}/g, customer.name || "Valued Customer"),
            html: htmlBody,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log(`Email sent to ${customer.email}:`, emailResult);

        if (!emailResponse.ok) {
          throw new Error(emailResult.message || "Failed to send email");
        }

        // Update email send record
        await fetch(
          `${supabaseUrl}/rest/v1/email_sends?id=eq.${emailSend.id}`,
          {
            method: "PATCH",
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "sent",
              sent_at: new Date().toISOString(),
            }),
          }
        );

        results.sent++;
      } catch (emailError: any) {
        console.error(`Error sending to ${customer.email}:`, emailError);
        results.failed++;
        results.errors.push(`${customer.email}: ${emailError.message}`);
      }
    }

    // Update campaign status
    await fetch(
      `${supabaseUrl}/rest/v1/campaigns?id=eq.${campaignId}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "sent",
          sent_at: new Date().toISOString(),
        }),
      }
    );

    console.log(`Campaign ${campaignId} completed:`, results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-campaign-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
