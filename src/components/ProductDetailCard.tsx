import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Sparkles } from 'lucide-react';

interface ProductDetailCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewDetails?: (product: Product) => void;
}

export function ProductDetailCard({ product, onAddToCart, onViewDetails }: ProductDetailCardProps) {
  return (
    <Card className="overflow-hidden shadow-elegant border-2 border-primary/20 hover:border-primary/40 transition-smooth">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image Section */}
        <div className="relative bg-gradient-subtle overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover min-h-[300px]"
            />
          ) : (
            <div className="w-full min-h-[300px] flex items-center justify-center">
              <Package className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
              Only {product.stock} left
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-2xl font-bold text-foreground leading-tight">
                {product.name}
              </h3>
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <div className="pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  ${(product.price / 100).toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">per unit</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                {product.stock > 0 ? (
                  <span className="text-primary font-medium">In Stock ({product.stock} available)</span>
                ) : (
                  <span className="text-destructive font-medium">Out of Stock</span>
                )}
              </span>
            </div>
          </CardContent>

          <CardFooter className="gap-2 pt-4">
            <Button
              onClick={() => onAddToCart(product, 1)}
              disabled={product.stock === 0}
              className="flex-1 h-12 text-base"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            {onViewDetails && (
              <Button
                variant="outline"
                onClick={() => onViewDetails(product)}
                className="h-12"
                size="lg"
              >
                Details
              </Button>
            )}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
