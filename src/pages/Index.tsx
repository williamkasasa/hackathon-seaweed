import { useState, useRef, useEffect } from 'react';
import { Product, Message, CartItem } from '@/lib/types';
import { ChatMessage } from '@/components/ChatMessage';
import { ProductModal } from '@/components/ProductModal';
import { ShoppingCart } from '@/components/ShoppingCart';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome! 👋 I\'m your AI shopping assistant. I can help you browse our products, answer questions, and complete your purchase. What are you looking for today?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('products');
      if (error) throw error;
      if (data?.products) {
        setProducts(Object.values(data.products));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [...messages, userMessage],
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        original_tool_calls: data.original_tool_calls,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Handle tool calls
      if (data.original_tool_calls) {
        handleToolCalls(data.original_tool_calls);
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolCalls = (toolCalls: any[]) => {
    toolCalls.forEach((toolCall) => {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      if (functionName === 'add_to_cart') {
        const product = products.find((p) => p.id === args.product_id);
        if (product) {
          handleAddToCart(product, args.quantity || 1);
        }
      } else if (functionName === 'start_checkout') {
        if (cart.length > 0) {
          setCheckoutOpen(true);
        } else {
          toast.error('Your cart is empty');
        }
      }
    });
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prev, { id: product.id, quantity: Math.min(quantity, product.stock) }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    toast.success('Item removed from cart');
  };

  const handleCheckoutComplete = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">AI Shop</h1>
          </div>
          <ShoppingCart
            cart={cart}
            products={products}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemove={handleRemoveFromCart}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-6xl">
        {/* Chat Messages */}
        <div className="flex-1 mb-6 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                message={message}
                products={products}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onViewDetails={setSelectedProduct}
              />
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-card rounded-2xl px-4 py-3 border border-border">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-card rounded-2xl border border-border shadow-elegant p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything or tell me what you're looking for..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        products={products}
        onCheckoutComplete={handleCheckoutComplete}
      />
    </div>
  );
};

export default Index;
