import { useState } from 'react';
import { CheckoutSession, Product, CartItem } from '@/lib/types';
import { DEFAULT_BUYER, DEFAULT_SHIPPING_ADDRESS, DEFAULT_PAYMENT_METHOD } from '@/lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  onCheckoutComplete: () => void;
}

export function CheckoutModal({ open, onClose, cart, products, onCheckoutComplete }: CheckoutModalProps) {
  const [step, setStep] = useState<'shipping' | 'review' | 'processing' | 'success'>('shipping');
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleCreateCheckout = async () => {
    setLoading(true);
    try {
      const items = cart.map((item) => ({ id: item.id, quantity: item.quantity }));
      const { data, error } = await supabase.functions.invoke('checkout-create', {
        body: {
          items,
          buyer: DEFAULT_BUYER,
          fulfillment_address: DEFAULT_SHIPPING_ADDRESS,
        },
      });

      if (error) throw error;

      setCheckout(data);
      if (data.fulfillment_options.length > 0) {
        setSelectedShipping(data.fulfillment_options[0].id);
      }
      setStep('review');
    } catch (error) {
      toast.error('Échec de la création de la session de paiement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipping = async () => {
    if (!checkout || !selectedShipping) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkout-update', {
        body: {
          checkoutId: checkout.id,
          fulfillment_option_id: selectedShipping,
        },
      });

      if (error) throw error;

      setCheckout(data);
    } catch (error) {
      toast.error('Échec de la mise à jour de l\'option de livraison');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!checkout) return;

    setStep('processing');
    try {
      const { data, error } = await supabase.functions.invoke('checkout-complete', {
        body: {
          checkoutId: checkout.id,
          payment_token: DEFAULT_PAYMENT_METHOD,
          payment_provider: 'stripe',
        },
      });

      if (error) throw error;

      setCheckout(data);
      setStep('success');
      toast.success('Commande passée avec succès !');
      setTimeout(() => {
        onCheckoutComplete();
        handleClose();
      }, 3000);
    } catch (error) {
      toast.error('Échec du paiement. Veuillez réessayer.');
      setStep('review');
      console.error(error);
    }
  };

  const handleClose = () => {
    setStep('shipping');
    setCheckout(null);
    setSelectedShipping('');
    onClose();
  };

  const getTotalAmount = (type: string) => {
    return checkout?.totals.find((t) => t.type === type)?.amount || 0;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 'shipping' && 'Informations de livraison'}
            {step === 'review' && 'Vérifier la commande'}
            {step === 'processing' && 'Traitement du paiement'}
            {step === 'success' && 'Commande confirmée !'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'shipping' && 'Confirmez votre adresse de livraison'}
            {step === 'review' && 'Vérifiez les détails de votre commande avant le paiement'}
            {step === 'processing' && 'Veuillez patienter pendant le traitement de votre paiement'}
            {step === 'success' && 'Votre commande a été passée avec succès'}
          </p>
        </DialogHeader>

        {step === 'shipping' && (
          <div className="space-y-6">
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Adresse de livraison</h3>
              <p className="text-sm text-muted-foreground">{DEFAULT_SHIPPING_ADDRESS.name}</p>
              <p className="text-sm text-muted-foreground">{DEFAULT_SHIPPING_ADDRESS.line_one}</p>
              {DEFAULT_SHIPPING_ADDRESS.line_two && (
                <p className="text-sm text-muted-foreground">{DEFAULT_SHIPPING_ADDRESS.line_two}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {DEFAULT_SHIPPING_ADDRESS.city}, {DEFAULT_SHIPPING_ADDRESS.state} {DEFAULT_SHIPPING_ADDRESS.postal_code}
              </p>
            </div>
            <Button className="w-full" size="lg" onClick={handleCreateCheckout} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Continuer vers la vérification
            </Button>
          </div>
        )}

        {step === 'review' && checkout && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Articles commandés</h3>
              {checkout.line_items.map((item, index) => {
                const cartItem = cart.find(c => c.id === item.item.id);
                const quantity = cartItem?.quantity || 1;
                const unitPrice = item.base_amount || 0;
                return (
                  <div key={item.id} className="flex justify-between items-start bg-card p-3 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{item.item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantité : {quantity}</p>
                      <p className="text-sm text-muted-foreground">{(unitPrice / 100).toFixed(2)} $ chacun</p>
                    </div>
                    <p className="font-semibold">${(item.total / 100).toFixed(2)}</p>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Options de livraison</h3>
              <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping}>
                {checkout.fulfillment_options.map((option) => {
                  const displayName = option.display_name || option.title || 'Shipping';
                  const description = option.description || option.subtitle || '';
                  const amount = typeof option.amount === 'number' 
                    ? option.amount 
                    : typeof option.total === 'string' 
                      ? parseInt(option.total) 
                      : typeof option.total === 'number'
                        ? option.total
                        : 0;
                  
                  return (
                    <div key={option.id} className="flex items-center space-x-2 bg-card p-3 rounded-lg border">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{displayName}</p>
                            {description && (
                              <p className="text-sm text-muted-foreground">{description}</p>
                            )}
                          </div>
                          <p className="font-semibold">${(amount / 100).toFixed(2)}</p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {selectedShipping !== checkout.fulfillment_option_id && (
                <Button variant="outline" className="w-full" onClick={handleUpdateShipping} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Mettre à jour la livraison
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total :</span>
                <span>{(getTotalAmount('subtotal') / 100).toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison :</span>
                <span>{(getTotalAmount('fulfillment') / 100).toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes :</span>
                <span>{(getTotalAmount('tax') / 100).toFixed(2)} $</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total :</span>
                <span className="text-2xl font-bold text-primary">{(getTotalAmount('total') / 100).toFixed(2)} $</span>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleCompletePayment}>
              Finaliser le paiement
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Traitement de votre paiement...</p>
            <p className="text-sm text-muted-foreground">Veuillez patienter</p>
          </div>
        )}

        {step === 'success' && checkout && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Commande confirmée !</h3>
            <p className="text-muted-foreground mb-6">Merci pour votre achat</p>
            <div className="bg-card p-4 rounded-lg border w-full max-w-sm">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">N° de commande : {checkout.id}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Un e-mail de confirmation a été envoyé à {DEFAULT_BUYER.email}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
