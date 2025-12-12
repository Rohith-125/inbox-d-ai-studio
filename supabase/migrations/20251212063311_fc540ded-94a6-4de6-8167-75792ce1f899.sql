-- Add CTA and image columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS cta_text TEXT,
ADD COLUMN IF NOT EXISTS cta_link TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for authenticated users to upload
CREATE POLICY "Users can upload campaign images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'campaign-images' AND auth.uid() IS NOT NULL);

-- Create policy for public read access
CREATE POLICY "Campaign images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'campaign-images');

-- Create policy for users to delete their own images
CREATE POLICY "Users can delete their campaign images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'campaign-images' AND auth.uid() IS NOT NULL);