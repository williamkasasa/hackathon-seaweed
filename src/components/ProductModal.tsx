import { useState } from 'react';
import { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductModal({ product, open, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square bg-gradient-subtle rounded-lg overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-24 h-24 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-muted-foreground mb-4">{product.description}</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">${(product.price / 100).toFixed(2)}</span>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Stock : {product.stock} disponible(s)</p>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm font-medium">Quantité :</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleAddToCart} disabled={product.stock === 0}>
              Ajouter au panier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
