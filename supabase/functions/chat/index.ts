import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const tools = [
  {
    type: 'function',
    function: {
      name: 'list_products',
      description: 'Fetch the product catalog from the seller',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_product_details',
      description: 'Display detailed information about a specific product in a beautiful UI card. Use this when discussing a single product.',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The ID of the product to show' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_cart',
      description: 'Signal the frontend to add an item to the cart',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'The ID of the product to add' },
          quantity: { type: 'number', description: 'The quantity to add', default: 1 },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'start_checkout',
      description: 'Signal the frontend to initiate the checkout flow',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

async function executeToolCall(toolName: string, args: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  switch (toolName) {
    case 'list_products':
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return JSON.stringify(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        return JSON.stringify({ error: 'Failed to fetch products' });
      }

    case 'show_product_details':
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', args.product_id)
          .single();
        
        if (error || !product) {
          return JSON.stringify({ error: 'Product not found' });
        }
        return JSON.stringify({ product });
      } catch (error) {
        console.error('Error fetching product details:', error);
        return JSON.stringify({ error: 'Failed to fetch product details' });
      }

    case 'add_to_cart':
      return JSON.stringify({
        success: true,
        message: `Added product ${args.product_id} (quantity: ${args.quantity || 1}) to cart`,
        action: 'frontend_add_to_cart',
        product_id: args.product_id,
        quantity: args.quantity || 1,
      });

    case 'start_checkout':
      return JSON.stringify({
        success: true,
        message: 'Starting checkout process',
        action: 'frontend_start_checkout',
      });

    default:
      return JSON.stringify({ error: 'Unknown tool' });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const DAT1_API_KEY = Deno.env.get('DAT1_API_KEY');

    // Initial LLM call
    let conversationHistory = [
      {
        role: 'system',
        content: `You are a helpful AI shopping assistant for Seaweed & Co. You can help users browse products, add items to their cart, and complete purchases. Be conversational and friendly.

IMPORTANT TOOLS YOU MUST USE:

1. When users ask about products or want to see the catalog, use the list_products tool.

2. When discussing a single product in detail, use show_product_details to display it beautifully with all information.

3. When users want to buy/purchase/add a product to cart (phrases like "I want to buy", "add to cart", "I'll take", "purchase"), you MUST:
   - Use the add_to_cart tool with the product_id
   - Confirm the action in your response (e.g., "I've added the Kombu Seaweed to your cart!")

4. When users want to checkout or complete their purchase, use the start_checkout tool.

Always be proactive - if a user shows interest in buying, offer to add items to their cart!`,
      },
      ...messages,
    ];

    // Tool-aware conversation loop (allows multiple tool calls like list_products then add_to_cart)
    let allToolCalls: any[] = [];
    let finalAssistantMessage: any = null;

    for (let i = 0; i < 3; i++) {
      console.log('Calling LLM (iteration', i + 1, ') with', conversationHistory.length, 'messages');

      const llmResponse = await fetch('https://api.dat1.co/api/v1/collection/open-ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAT1_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-120-oss',
          messages: conversationHistory,
          temperature: 0.7,
          tools,
          tool_choice: 'auto',
        }),
      });

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        console.error('LLM API error:', llmResponse.status, errorText);
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      const llmData = await llmResponse.json();
      const assistantMessage = llmData.choices[0].message;

      const toolCalls = assistantMessage.tool_calls || [];
      console.log('LLM response received, tool calls:', toolCalls.length);

      if (toolCalls.length === 0) {
        // No more tool calls – this is our final answer
        finalAssistantMessage = assistantMessage;
        break;
      }

      // Track all tools used so the frontend can react (e.g. add_to_cart, start_checkout)
      allToolCalls = allToolCalls.concat(toolCalls);

      // Add assistant message that triggered tools
      conversationHistory.push(assistantMessage);

      // Execute each tool call and append results
      for (const toolCall of toolCalls) {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        console.log('Executing tool:', toolCall.function.name, 'with args:', args);
        const result = await executeToolCall(toolCall.function.name, args);
        console.log('Tool result:', result);

        conversationHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Loop will call the LLM again with updated conversationHistory so it can use
      // tool results (e.g. product IDs) to decide next actions like add_to_cart.
    }

    if (!finalAssistantMessage) {
      // Safety fallback if the model never produced a normal assistant message
      return new Response(
        JSON.stringify({
          role: 'assistant',
          content: 'Sorry, I had trouble processing your request. Please try again.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        role: 'assistant',
        content: finalAssistantMessage.content,
        original_tool_calls: allToolCalls,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
