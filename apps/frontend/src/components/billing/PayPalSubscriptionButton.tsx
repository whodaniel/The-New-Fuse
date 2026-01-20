import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';

interface PayPalSubscriptionButtonProps {
  planId?: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: any) => void;
}

export const PayPalSubscriptionButton = ({
  planId = import.meta.env.VITE_PAYPAL_PLAN_ID,
  onSuccess,
  onError,
}: PayPalSubscriptionButtonProps) => {
  const [error, setError] = useState<string | null>(null);

  if (!planId) {
    return <div className="text-red-500">Error: Missing PayPal Plan ID</div>;
  }

  const initialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
    intent: 'subscription',
    vault: true,
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full max-w-md mx-auto relative z-10">
        <PayPalButtons
          style={{
            shape: 'rect',
            color: 'blue',
            layout: 'vertical',
            label: 'subscribe',
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
              const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/billing/paypal/subscribe`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // TODO: Add Auth Token from context
                  },
                  body: JSON.stringify({
                    subscriptionID: data.subscriptionID,
                    planID: planId,
                  }),
                }
              );

              if (!response.ok) {
                console.error('Failed to record subscription on backend');
              }

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
