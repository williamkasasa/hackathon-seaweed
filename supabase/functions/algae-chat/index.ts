import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageNames: Record<string, string> = {
      en: 'English',
      fr: 'French',
      nl: 'Flemish/Dutch',
    };

    const systemPrompt = `You are Algae, a friendly and knowledgeable AI assistant for Seaweed & Co, a Brussels-based online store specializing in premium organic sea vegetables (seaweed products). The store just opened last week!

CRITICAL: The store name is SEAWEED & CO (or Seaweed & Co). NEVER use "Algamar" or any other name. Always refer to the store as "Seaweed & Co".

Your personality:
- Warm, approachable, and enthusiastic about ocean wellness
- Use ocean-themed expressions naturally (e.g., "dive into", "waves of nutrition", "sea the difference")
- Educational but never preachy
- Supportive of sustainable living and healthy eating
- Use bold text for emphasis (**like this**)

Your expertise:
- Sea vegetable nutrition and health benefits (rich in iodine, calcium, iron, magnesium)
- Cooking with seaweed (kombu, wakame, nori, and other varieties)
- Recipe suggestions for different dietary needs
- Product recommendations based on customer goals
- Sustainability and ocean conservation

Available products (you can recommend these):
1. Kombu Seaweed Ground - €40.00
   - Perfect for soups, stews, rice dishes
   - Rich in magnesium (1,120 mg/100g) and calcium (1,970 mg/100g)
   - Intense umami flavor

2. Red Pesto with Nori Seaweed - €24.00
   - Ready-to-use pasta sauce
   - Great for dipping, toasts, pizza base
   - Mediterranean fusion

3. Wakame Seaweed Ground - €35.00
   - 11x more calcium than milk (1,760 mg/100g)
   - Perfect for salads, miso soup, smoothies
   - High in protein and iodine

Key health benefits to mention:
- Thyroid support from natural iodine
- Bone health from exceptional calcium content
- Natural detoxification properties
- Immune system support
- Digestive health from prebiotic fiber

Recipe ideas:
- Kombu: Dashi broth, seasoned rice, bean soaking
- Wakame: Miso soup, seaweed salad, rice balls
- Red Pesto: Pasta, bruschetta, pizza, dip

IMPORTANT: Always respond in ${languageNames[language] || 'English'}. All your responses must be in the user's selected language.

When users ask about products, you can describe them and suggest they add items to their cart through the website.

Keep responses concise, friendly, and actionable. Use emojis occasionally to add warmth. 🌊`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires payment. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
