import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map our product IDs to seller backend product IDs
const PRODUCT_MAPPING = {
  'kombu': 'item_123',
  'wakame': 'item_456',
  'pesto': 'item_789',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const SELLER_BACKEND_URL = Deno.env.get('SELLER_BACKEND_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get our products from database
    const { data: ourProducts, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error('Failed to fetch products');
    }
    
    // Create a mapping from our product IDs to seller backend IDs
    const productIdMap: Record<string, string> = {};
    ourProducts?.forEach((product, index) => {
      const mappedId = ['item_123', 'item_456', 'item_789'][index] || 'item_123';
      productIdMap[product.id] = mappedId;
    });
    
    // Transform cart items to use seller backend product IDs
    const transformedCart = body.cart.map((item: any) => ({
      ...item,
      id: productIdMap[item.id] || item.id,
    }));
    
    console.log('Creating checkout with transformed cart:', transformedCart);
    
    const response = await fetch(`${SELLER_BACKEND_URL}/checkout_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        cart: transformedCart,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Seller backend error:', response.status, errorText);
      throw new Error(`Seller backend error: ${response.status}`);
    }

    const data = await response.json();
    
    // Store mapping for later retrieval
    console.log('Checkout created successfully:', data.id);
    
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
