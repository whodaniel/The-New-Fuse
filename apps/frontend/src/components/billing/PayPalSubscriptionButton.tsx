import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { apiService } from '../../services/api';

interface PayPalSubscriptionButtonProps {
  planId?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: any) => void;
}

export const PayPalSubscriptionButton = ({
  planId = import.meta.env.VITE_PAYPAL_PLAN_ID || 'P-3WD251534W148423SNFXJQVI',
  onSuccess,
  onError,
}: PayPalSubscriptionButtonProps) => {
  const [error, setError] = useState<string | null>(null);

  if (!planId) {
    return <div className="text-red-500">Error: Missing PayPal Plan ID</div>;
  }

  const initialOptions = {
    clientId:
      import.meta.env.VITE_PAYPAL_CLIENT_ID ||
      'AV2Eo0_OPFXA9KV5P6p8B8er2UXt3d2HCChifFAu6Wsqft_ugihbYhgwd9v7lCXpUvs9m_C7BxntbtbM',
    intent: 'subscription',
    vault: true,
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full relative z-10 mt-2">
        <PayPalButtons
          style={{
            shape: 'rect',
            color: 'white',
            layout: 'horizontal',
            label: 'subscribe',
            height: 48,
            tagline: false,
          }}
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              plan_id: planId,
            });
          }}
          onApprove={async (data, actions) => {
            console.log('Subscription approved:', data);

            // Call our backend to record the subscription
            try {
              const response = await apiService.post('/api/billing/paypal/subscribe', {
                subscriptionID: data.subscriptionID,
                planID: planId,
              });

              if (onSuccess && data.subscriptionID) {
                onSuccess(data.subscriptionID);
              }
            } catch (err) {
              console.error('Error recording subscription:', err);
              if (onError) onError(err);
            }
          }}
          onError={(err) => {
            console.error('PayPal Error:', err);
            setError('Payment failed. Please try again.');
            if (onError) onError(err);
          }}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </PayPalScriptProvider>
  );
};
