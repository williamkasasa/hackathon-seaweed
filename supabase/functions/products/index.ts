import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache products for 1 hour to avoid regenerating on every request
// Reset cache on deployment by using a version number
const CACHE_VERSION = '3'; // Increment this to invalidate cache
let cachedProducts: any = null;
let cacheTimestamp = 0;
let cacheVersion = '';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

async function generateProducts() {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a product catalog generator for a premium natural seaweed e-commerce platform. Generate diverse, market-ready products.',
        },
        {
          role: 'user',
          content: `Generate 10 unique seaweed products covering these categories:
- Gourmet Food/Cooking (dried, spices, ready-to-eat)
- Health & Wellness Supplements (capsules, powders, drinks)
- Skincare & Beauty (masks, serums, soaps)
- Pet/Household (fertilizer, pet treats)

Use different seaweed types: Laminaria (Kelp), Wakame, Hijiki, Chondrus Crispus (Irish Moss), Fucus Vesiculosus (Bladderwrack).

Tone: Natural, premium, health-conscious, artisanal.
Focus: Sustainability, minerals, hydration, detoxification, unique flavors.`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_products',
            description: 'Generate a catalog of 10 seaweed products',
            parameters: {
              type: 'object',
              properties: {
                products: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        description: 'Unique SKU identifier (e.g., SKU-201)',
                      },
                      name: {
                        type: 'string',
                        description: 'Catchy, market-friendly product name',
                      },
                      description: {
                        type: 'string',
                        description: 'Single concise sentence with primary benefit and key ingredient',
                      },
                      price: {
                        type: 'number',
                        description: 'Price in cents (1000-6000 for $10-$60)',
                      },
                      stock: {
                        type: 'number',
                        description: 'Available inventory (10-100)',
                      },
                      image: {
                        type: 'string',
                        description: 'Image URL placeholder',
                      },
                    },
                    required: ['id', 'name', 'description', 'price', 'stock', 'image'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['products'],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'generate_products' } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI error:', response.status, errorText);
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices[0].message.tool_calls?.[0];
  
  if (!toolCall) {
    throw new Error('No products generated');
  }

  const generatedProducts = JSON.parse(toolCall.function.arguments);
  
  // Map product images - use custom images for specific products
  const products = generatedProducts.products.map((product: any) => {
    const nameLower = product.name.toLowerCase();
    
    // Check for specific product names and assign custom images
    if (nameLower.includes('kelp flakes') || nameLower.includes('artisanal kelp')) {
      return {
        ...product,
        image: '/images/artisanal-kelp-flakes.png',
      };
    }
    
    if ((nameLower.includes('spirulina') && nameLower.includes('wakame')) || 
        nameLower.includes('immunity boost')) {
      return {
        ...product,
        image: '/images/spirulina-wakame-immunity-boost.png',
      };
    }
    
    // Use Unsplash placeholder for other products
    return {
      ...product,
      image: `https://images.unsplash.com/photo-${1505253149613 + Math.floor(Math.random() * 1000000)}?w=400`,
    };
  });
  
  return products;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if cache is still valid
    const now = Date.now();
    const cacheValid = cachedProducts && 
                       cacheVersion === CACHE_VERSION && 
                       (now - cacheTimestamp) <= CACHE_DURATION;
    
    if (!cacheValid) {
      console.log('Generating new products...');
      cachedProducts = await generateProducts();
      cacheTimestamp = now;
      cacheVersion = CACHE_VERSION;
      console.log('Products generated:', cachedProducts.length);
      console.log('First product:', JSON.stringify(cachedProducts[0]));
    } else {
      console.log('Returning cached products');
    }
    
    return new Response(JSON.stringify({ products: cachedProducts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Fallback to basic products if AI generation fails
    const fallbackProducts = [
      {
        id: 'SKU-001',
        name: 'Organic Kelp Powder',
        description: 'Rich in minerals and perfect for smoothies and soups.',
        price: 1995,
        stock: 50,
        image: 'https://images.unsplash.com/photo-1505253149613-112d21d9f6a9?w=400',
      },
    ];
    
    return new Response(
      JSON.stringify({ products: fallbackProducts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
