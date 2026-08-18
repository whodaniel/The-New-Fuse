import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { authFetch } from '@/utils/authToken';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.thenewfuse.com';

const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  // Surface the Stripe redirect outcome to the user. success/cancel are
  // appended by Stripe to the successUrl/cancelUrl we send on checkout.
  // processing is a rare in-between state Stripe uses while the session
  // is still finalising — we leave the loading affordance on-screen.
  // The params are cleared from the URL on first read so a refresh of
  // /pricing doesn't re-fire the toasts forever.
  useEffect(() => {
    const status = searchParams.get('checkout');
    if (!status) return;
    if (status === 'success') {
      toast.success(
        'Subscription confirmed — your plan is active. The receipt is on its way to your email.',
        { duration: 8000 }
      );
    } else if (status === 'cancel') {
      toast.error(
        'Checkout cancelled — no charge was made. Pick a plan whenever you’re ready.',
        { duration: 6000 }
      );
    } else if (status === 'processing') {
      toast('Finalising your subscription…', { icon: '⏳', duration: 5000 });
    }
    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/billing/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          successUrl: `${window.location.origin}/pricing?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=cancel`,
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
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your automation needs. Whether you're a hobbyist or an
            enterprise, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-card rounded-2xl p-8 shadow-sm border border-border flex flex-col hover:border-primary/50 transition-colors">
            <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
            <p className="text-muted-foreground mb-6 h-12">
              Perfect for individuals and hobbyists exploring AI workflows.
            </p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-foreground">$0</span>
              <span className="text-xl text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Bring Your Own Key (BYOK)',
                'Local API connections (Ollama, LMStudio)',
                'Up to 5 AI Agents',
                'Basic Workflow Builder',
                'Community Support',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-primary shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/auth/register')}
              className="w-full rounded-md px-4 py-3 text-base font-semibold transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-card rounded-2xl p-8 shadow-md border-2 border-primary relative flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Pro (Pilot)</h3>
            <p className="text-muted-foreground mb-6 h-12">
              For power users and teams who need advanced capabilities.
            </p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-foreground">$29</span>
              <span className="text-xl text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'TNF Cloud Hosted Models Included',
                'OpenAI, Anthropic, Gemini access',
                'Up to 25 AI Agents',
                'Advanced Workflow Automation',
                'Priority Support',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-primary shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="w-full mt-auto">
              <button
                onClick={() =>
                  handleSubscribe(import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly')
                }
                disabled={
                  loading === (import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly')
                }
                className="w-full rounded-md px-4 py-3 text-base font-semibold transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90 flex justify-center items-center"
              >
                {loading === (import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly') ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
                  </>
                ) : (
                  'Subscribe to Pro'
                )}
              </button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-card rounded-2xl p-8 shadow-sm border border-border flex flex-col hover:border-primary/50 transition-colors">
            <h3 className="text-2xl font-bold text-foreground mb-2">Teams</h3>
            <p className="text-muted-foreground mb-6 h-12">
              For organizations requiring custom integrations and scale.
            </p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-foreground">$99</span>
              <span className="text-xl text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Everything in Pro',
                'Shared Workspaces',
                'Custom Agent Branding',
                'Dedicated Infrastructure',
                'Slack Integration',
              ].map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-primary shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="w-full mt-auto">
              <button
                onClick={() =>
                  handleSubscribe(
                    import.meta.env.VITE_STRIPE_TEAMS_PRICE_ID || 'price_teams_monthly'
                  )
                }
                disabled={
                  loading === (import.meta.env.VITE_STRIPE_TEAMS_PRICE_ID || 'price_teams_monthly')
                }
                className="w-full rounded-md px-4 py-3 text-base font-semibold transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/90 flex justify-center items-center"
              >
                {loading ===
                (import.meta.env.VITE_STRIPE_TEAMS_PRICE_ID || 'price_teams_monthly') ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
                  </>
                ) : (
                  'Subscribe to Teams'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground flex justify-center items-center gap-2">
            <svg
              className="w-4 h-4"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 37.5C10.335 37.5 2.5 29.665 2.5 20 2.5 10.335 10.335 2.5 20 2.5c9.665 0 17.5 7.835 17.5 17.5 0 9.665-7.835 17.5-17.5 17.5zm7.307-23.753l-9.845 9.845-4.269-4.269a1.25 1.25 0 10-1.768 1.768l5.153 5.153c.244.244.564.366.884.366s.64-.122.884-.366l10.73-10.73a1.25 1.25 0 10-1.769-1.767z"
                fill="currentColor"
              />
            </svg>
            Secured by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
