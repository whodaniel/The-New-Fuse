import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
  popular?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'MyPhoneRemote Pro',
    price: '$4.99',
    description: 'Mirror your Mac to iPhone with AI control',
    priceId: process.env.REACT_APP_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    features: [
      'Real-time Mac to iPhone mirroring',
      'AI-assisted remote control',
      'Touch-to-move cursor',
      'Pinch-to-zoom support',
      'Priority support',
    ],
  },
  {
    name: 'MyPhoneRemote AI Agent',
    price: '$14.99',
    description: 'Full AI-driven remote control & automation',
    priceId: process.env.REACT_APP_STRIPE_AI_AGENT_PRICE_ID || 'price_ai_agent_monthly',
    popular: true,
    features: [
      'Everything in Pro',
      'Autonomous AI agent control',
      'Workflow automation',
      'Advanced gesture recognition',
      'Custom integrations',
      'Dedicated support channel',
    ],
  },
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.thenewfuse.com';

export default function MyPhoneRemoteCheckout() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: PricingTier) => {
    setLoading(tier.priceId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/billing/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: tier.priceId,
          successUrl: `${window.location.origin}/membership?checkout=success`,
          cancelUrl: `${window.location.origin}/membership?checkout=cancel`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to start checkout. Please try again.'
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">MyPhoneRemote</h1>
          <p className="text-xl text-slate-300 mb-2">
            Control your Mac from your iPhone, powered by AI
          </p>
          <p className="text-slate-400">Choose the plan that fits your needs</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${tier.popular ? 'border-2 border-blue-500' : 'border border-slate-700'}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
                <CardDescription className="text-slate-400">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300">
                      <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(tier)}
                  disabled={loading === tier.priceId}
                >
                  {loading === tier.priceId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Subscribe Now</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400">Secured by Stripe. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
