import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StripeCheckoutFormProps {
  total: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const StripeCheckoutForm = ({ total, onSuccess, onError }: StripeCheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmacao`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Erro no pagamento');
      toast.error(error.message || 'Erro ao processar pagamento');
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              address: { country: 'BR' },
            },
          },
        }}
      />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          `Pagar R$ ${total.toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

export default StripeCheckoutForm;
