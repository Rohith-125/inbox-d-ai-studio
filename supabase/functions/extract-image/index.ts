import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching page to extract image:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InboxdBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Try to extract og:image first, then twitter:image, then first large image
    let imageUrl: string | null = null;

    // og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) {
      imageUrl = ogMatch[1];
    }

    // twitter:image fallback
    if (!imageUrl) {
      const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twMatch) {
        imageUrl = twMatch[1];
      }
    }

    // product image fallback - look for large images
    if (!imageUrl) {
      const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*/gi);
      if (imgMatches) {
        for (const img of imgMatches) {
          const srcMatch = img.match(/src=["']([^"']+)["']/i);
          if (srcMatch) {
            const src = srcMatch[1];
            // Skip tiny icons, tracking pixels, etc.
            if (src.includes("logo") || src.includes("icon") || src.includes("favicon") || src.includes("1x1") || src.includes("pixel")) continue;
            // Prefer images that look like product images
            if (src.match(/\.(jpg|jpeg|png|webp)/i)) {
              imageUrl = src;
              break;
            }
          }
        }
      }
    }

    // Make relative URLs absolute
    if (imageUrl && !imageUrl.startsWith("http")) {
      const baseUrl = new URL(url);
      imageUrl = new URL(imageUrl, baseUrl.origin).toString();
    }

    console.log("Extracted image:", imageUrl);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error extracting image:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to extract image" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
