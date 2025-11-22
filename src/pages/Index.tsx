import { useState, useRef, useEffect } from 'react';
import { Product, Message, CartItem } from '@/lib/types';
import { ChatMessage } from '@/components/ChatMessage';
import { ProductModal } from '@/components/ProductModal';
import { ShoppingCart } from '@/components/ShoppingCart';
import { CheckoutModal } from '@/components/CheckoutModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Waves, Loader2, Package, Sparkles as SparklesIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Seaweed & Co! 🌊 I\'m your kelp consultant and shopping assistant. I can help you discover the power of the ocean with our natural seaweed products. Are you looking for skincare, superfood supplements, or recipe ideas?',
    },
  ]);
  const [showQuickActions, setShowQuickActions] = useState(true);
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
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || loading) return;

    const userMessage: Message = { role: 'user', content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setShowQuickActions(false);
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
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-ocean flex items-center justify-center shadow-elegant">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">🌊 Seaweed & Co.</h1>
              <p className="text-xs text-muted-foreground">Harnessing the Power of the Ocean</p>
            </div>
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
              <div key={index}>
                <ChatMessage 
                  message={message}
                  products={products}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onViewDetails={setSelectedProduct}
                />
                {/* Quick Action Buttons - Show only after first message */}
                {index === 0 && showQuickActions && (
                  <div className="flex flex-wrap gap-2 mt-4 ml-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage('Show me all products')}
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Browse All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage('What are your skincare products?')}
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary"
                    >
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Skincare Range
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage('Tell me about superfood supplements')}
                      className="border-primary/30 hover:bg-primary/10 hover:border-primary"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Supplements
                    </Button>
                  </div>
                )}
              </div>
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
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
              placeholder="Ask me anything or tell me what you're looking for..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={() => handleSendMessage()}
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
