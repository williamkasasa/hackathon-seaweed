import { CartItem, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart as CartIcon, Minus, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ShoppingCartProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export function ShoppingCart({ cart, products, onUpdateQuantity, onRemove, onCheckout }: ShoppingCartProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartWithProducts = cart.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.id),
  })).filter((item) => item.product);

  const subtotal = cartWithProducts.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <CartIcon className="w-5 h-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Panier ({totalItems})</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col flex-1 mt-6 overflow-hidden">
          <div className="flex-1 overflow-auto pb-4">
            {cartWithProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CartIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Votre panier est vide</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartWithProducts.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-card rounded-lg border">
                    <div className="w-20 h-20 bg-gradient-subtle rounded-md overflow-hidden flex-shrink-0">
                      {item.product?.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CartIcon className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">{item.product?.name}</h4>
                      <p className="text-sm font-bold text-primary mb-2">
                        ${((item.product?.price || 0) / 100).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product?.stock || 0)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cartWithProducts.length > 0 && (
            <div className="border-t pt-4 pb-6 bg-background">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Sous-total :</span>
                  <span className="text-2xl font-bold text-primary">{(subtotal / 100).toFixed(2)} $</span>
                </div>
                <Button className="w-full" size="lg" onClick={onCheckout}>
                  Passer à la caisse
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
