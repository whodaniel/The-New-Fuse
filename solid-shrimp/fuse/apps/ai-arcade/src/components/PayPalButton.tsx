import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import React, { useState } from 'react';

interface PayPalButtonProps {
  planId: string;
  onSuccess?: (subscriptionId: string) => void;
  onError?: (error: any) => void;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ planId, onSuccess, onError }) => {
  const [error, setError] = useState<string | null>(null);
  const PayPalScriptProviderCompat = PayPalScriptProvider as unknown as React.ComponentType<any>;
  const PayPalButtonsCompat = PayPalButtons as unknown as React.ComponentType<any>;

  const initialOptions = {
    clientId: 'AV2Eo0_OPFXA9KV5P6p8B8er2UXt3d2HCChifFAu6Wsqft_ugihbYhgwd9v7lCXpUvs9m_C7BxntbtbM',
    intent: 'subscription',
    vault: true,
  };

  return (
    <PayPalScriptProviderCompat options={initialOptions}>
      <div className="paypal-button-container">
        <PayPalButtonsCompat
          style={{
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe',
            height: 40,
            tagline: false,
          }}
          createSubscription={(_data: any, actions: any) => {
            return actions.subscription.create({
              plan_id: planId,
            });
          }}
          onApprove={async (data: any) => {
            console.log('Arcade Subscription approved:', data);
            if (onSuccess && data.subscriptionID) {
              onSuccess(data.subscriptionID);
            }
          }}
          onError={(err: any) => {
            console.error('PayPal Arcade Error:', err);
            setError('Payment failed. Try again.');
            if (onError) onError(err);
          }}
        />
        {error && <p className="error-text">{error}</p>}
      </div>
    </PayPalScriptProviderCompat>
  );
};
