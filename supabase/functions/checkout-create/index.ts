import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory checkout session storage (use database in production)
const checkoutSessions = new Map<string, any>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, buyer, fulfillment_address } = await req.json();
    
    // Fetch products from our products function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: productsData, error: productsError } = await supabase.functions.invoke('products');
    
    if (productsError) throw new Error('Failed to fetch products');
    
    const products = productsData.products;
    
    // Calculate line items and totals
    const lineItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.id);
      if (!product) throw new Error(`Product ${item.id} not found`);
      
      const quantity = item.quantity || 1;
      const baseAmount = product.price * quantity;
      
      return {
        id: item.id,
        item: { id: item.id, quantity },
        base_amount: baseAmount,
        discount: 0,
        subtotal: baseAmount,
        tax: 0,
        total: baseAmount,
      };
    });
    
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const shippingCost = 300; // $3.00 standard shipping
    const tax = 0;
    const total = subtotal + shippingCost + tax;
    
    // Create checkout session
    const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const session = {
      id: checkoutId,
      buyer: buyer || null,
      payment_provider: {
        provider: 'stripe',
        supported_payment_methods: ['card'],
      },
      status: 'ready_for_payment',
      currency: 'usd',
      line_items: lineItems,
      fulfillment_address: fulfillment_address || null,
      fulfillment_options: [
        {
          type: 'shipping',
          id: 'shipping_standard',
          title: 'Standard Shipping',
          subtitle: '5-7 business days',
          carrier: 'USPS',
          subtotal: '300',
          tax: '0',
          total: '300',
        },
        {
          type: 'shipping',
          id: 'shipping_fast',
          title: 'Express Shipping',
          subtitle: '2-3 business days',
          carrier: 'FedEx',
          subtotal: '500',
          tax: '0',
          total: '500',
        },
        {
          type: 'shipping',
          id: 'shipping_overnight',
          title: 'Overnight Shipping',
          subtitle: 'Next business day',
          carrier: 'FedEx',
          subtotal: '800',
          tax: '0',
          total: '800',
        },
      ],
      fulfillment_option_id: 'shipping_standard',
      totals: [
        { type: 'subtotal', display_text: 'Subtotal', amount: subtotal },
        { type: 'fulfillment', display_text: 'Shipping', amount: shippingCost },
        { type: 'tax', display_text: 'Tax', amount: tax },
        { type: 'total', display_text: 'Total', amount: total },
      ],
      messages: [],
      links: [
        { type: 'terms_of_use', url: 'https://example.com/terms' },
        { type: 'privacy_policy', url: 'https://example.com/privacy' },
      ],
    };
    
    // Store session
    checkoutSessions.set(checkoutId, session);
    
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
