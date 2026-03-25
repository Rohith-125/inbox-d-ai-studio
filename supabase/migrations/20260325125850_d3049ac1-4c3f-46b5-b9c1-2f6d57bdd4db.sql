
-- Create enums for behavioral data
CREATE TYPE public.cart_status AS ENUM ('empty', 'active', 'abandoned');
CREATE TYPE public.engagement_level AS ENUM ('new', 'active', 'inactive', 'vip');

-- Add behavioral columns to customers table
ALTER TABLE public.customers
  ADD COLUMN cart_status public.cart_status DEFAULT 'empty',
  ADD COLUMN last_purchase_date timestamp with time zone,
  ADD COLUMN total_purchases integer DEFAULT 0,
  ADD COLUMN engagement_level public.engagement_level DEFAULT 'new';
