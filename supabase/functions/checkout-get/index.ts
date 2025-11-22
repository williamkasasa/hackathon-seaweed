import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const checkoutId = url.searchParams.get('id');
    
    if (!checkoutId) {
      throw new Error('Checkout ID is required');
    }

    const SELLER_BACKEND_URL = Deno.env.get('SELLER_BACKEND_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch checkout from seller backend
    const response = await fetch(`${SELLER_BACKEND_URL}/checkout_sessions/${checkoutId}`);
    
    if (!response.ok) {
      throw new Error(`Seller backend error: ${response.status}`);
    }

    const checkoutData = await response.json();
    
    // Get our products from database
    const { data: ourProducts, error: productsError } = await supabase
      .from('products')
      .select('*');
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      // Return original data if we can't fetch our products
      return new Response(JSON.stringify(checkoutData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create mapping from seller backend IDs to our products
    const sellerToOurProducts: Record<string, any> = {};
    ourProducts?.forEach((product, index) => {
      const sellerId = ['item_123', 'item_456', 'item_789'][index] || 'item_123';
      sellerToOurProducts[sellerId] = product;
    });
    
    // Replace line items with our product data while keeping pricing from seller backend
    if (checkoutData.line_items && Array.isArray(checkoutData.line_items)) {
      checkoutData.line_items = checkoutData.line_items.map((lineItem: any) => {
        const ourProduct = sellerToOurProducts[lineItem.item?.id];
        if (ourProduct) {
          return {
            ...lineItem,
            item: {
              ...ourProduct,
              // Keep the ID for tracking, but use our product details
            }
          };
        }
        return lineItem;
      });
    }
    
    return new Response(JSON.stringify(checkoutData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching checkout:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
