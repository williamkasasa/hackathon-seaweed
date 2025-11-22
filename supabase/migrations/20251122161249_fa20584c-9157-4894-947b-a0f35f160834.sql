-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL, -- price in cents
  stock INTEGER NOT NULL DEFAULT 100,
  image TEXT,
  usage_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (products should be viewable by everyone)
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);

-- Insert the products from CSV with enhanced descriptions and usage info
INSERT INTO public.products (name, description, price, stock, image, usage_info) VALUES
(
  'Kombu Seaweed Ground',
  'Add to the cooking of soups, vegetables, pasta and stews. 100% organic kelp for an intense umami flavor. Rich in minerals with high magnesium (1,120 mg per 100g) and calcium (1,970 mg per 100g).',
  1995,
  50,
  'https://www.algamar.us/cdn/shop/products/Groundkombu70g_1100x.jpg?v=1662132747',
  'Perfect for: Seasoned Popcorn • Rice Balls • Salad Dressing • Soups & Stews. Health benefits: Detoxifying properties, supports nervous system, promotes joint elasticity and healthy skin.'
),
(
  'Wakame Seaweed Ground, Organic - Kosher',
  'Organic Wakame seaweed blend with sesame oil, carrot, shiitake mushroom, rice vinegar, soy sauce, agave, toasted sesame and ginger. From sustainable organic wild harvest. Contains 11x more calcium than milk!',
  2195,
  50,
  'https://www.algamar.us/cdn/shop/products/GroundWakame70g-01_1100x.jpg?v=1662133627',
  'Perfect for: Wakame Salad • Miso Soup • Rice Balls • Smoothies. Health benefits: Exceptional calcium source (1,760 mg per 100g), high protein, rich in iodine for thyroid health, vitamin E, selenium, natural detoxifier.'
),
(
  'Red Pesto with Nori Seaweed, Organic',
  'Ready to enjoy: ideal as a sauce to accompany pasta. Perfect for dipping. Irresistible for making toasts and canapés. Try it as a base for pizzas.',
  2450,
  50,
  'https://www.algamar.us/cdn/shop/products/TARTARredpestonori_1100x.jpg?v=1662135031',
  'Perfect for: Pasta sauce • Dipping • Toasts & Canapés • Pizza base. A delicious way to incorporate seaweed nutrition into Mediterranean-style dishes.'
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();