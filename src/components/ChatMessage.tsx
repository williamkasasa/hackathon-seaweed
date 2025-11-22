import { Message, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ProductDetailCard } from '@/components/ProductDetailCard';
import { ShoppingCart } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  products?: Product[];
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export function ChatMessage({ message, products, onAddToCart, onViewDetails }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasProductToolCall = message.original_tool_calls?.some(
    (tc) => tc.function.name === 'list_products'
  );
  const hasProductDetailCall = message.original_tool_calls?.some(
    (tc) => tc.function.name === 'show_product_details'
  );
  
  // Find the specific product for detail view
  let detailProduct: Product | undefined;
  if (hasProductDetailCall && products) {
    const detailCall = message.original_tool_calls?.find(
      (tc) => tc.function.name === 'show_product_details'
    );
    if (detailCall) {
      const args = JSON.parse(detailCall.function.arguments);
      detailProduct = products.find((p) => p.id === args.product_id);
    }
  }

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-4 py-3 transition-smooth',
          isUser
            ? 'bg-primary text-primary-foreground shadow-elegant max-w-[80%]'
            : 'bg-card text-card-foreground border border-border shadow-sm w-full'
        )}
      >
        {/* Only show text content if not displaying products, or show a brief intro */}
        {!isUser && hasProductToolCall && products && products.length > 0 ? (
          <p className="text-sm leading-relaxed mb-4">
            Here are our seaweed products available right now:
          </p>
        ) : !isUser && hasProductDetailCall && detailProduct ? (
          <p className="text-sm leading-relaxed mb-4">{message.content}</p>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        
        {/* Product Detail Card */}
        {!isUser && hasProductDetailCall && detailProduct && (
          <div className="mt-2">
            <ProductDetailCard
              product={detailProduct}
              onAddToCart={(p, q) => onAddToCart?.(p)}
              onViewDetails={onViewDetails}
            />
          </div>
        )}
        
        {/* Product Grid */}
        {!isUser && hasProductToolCall && products && products.length > 0 && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden transition-smooth hover:shadow-elegant group cursor-pointer">
                <div
                  className="aspect-square bg-gradient-subtle relative overflow-hidden"
                  onClick={() => onViewDetails?.(product)}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {product.stock < 10 && product.stock > 0 && (
                    <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
                      Only {product.stock} left
                    </div>
                  )}
                </div>
                <CardContent className="p-4" onClick={() => onViewDetails?.(product)}>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                  <p className="text-2xl font-bold text-primary">${(product.price / 100).toFixed(2)}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart?.(product);
                    }}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
