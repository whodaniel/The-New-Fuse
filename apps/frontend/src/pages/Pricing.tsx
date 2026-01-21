import { PayPalSubscriptionButton } from '@/components/billing/PayPalSubscriptionButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Rocket } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const PricingCard = ({
  title,
  price,
  description,
  features,
  popular = false,
  buttonText,
  buttonLink,
  isPro = false,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonLink: string;
  isPro?: boolean;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={cn(
      'relative flex flex-col p-8 rounded-2xl border transition-all duration-300 animate-scale-in',
      popular
        ? 'bg-surface/50 border-primary/50 shadow-xl'
        : 'bg-surface/10 border-border/50 hover:border-border'
    )}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Badge className="bg-linear-to-r from-primary to-blue-500 text-white border-0 px-4 py-1">
          Most Popular
        </Badge>
      </div>
    )}

    <div className="mb-8">
      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm h-10">{description}</p>
    </div>

    <div className="mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-heading font-bold text-foreground">{price}</span>
        {price !== 'Custom' && price !== 'Free' && (
          <span className="text-muted-foreground">/month</span>
        )}
      </div>
    </div>

    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="mt-1 bg-success/10 rounded-full p-1">
            <Check className="w-3 h-3 text-success" />
          </div>
          <span className="text-sm text-muted-foreground">{feature}</span>
        </li>
      ))}
    </ul>

    <div className="mt-auto">
      {isPro ? (
        <PayPalSubscriptionButton
          onSuccess={(subId) => {
            console.log('Successfully subscribed:', subId);
            window.location.href = '/dashboard?subscribed=true';
          }}
        />
      ) : (
        <Button
          asChild
          variant={popular ? 'default' : 'secondary'}
          className={cn(
            'w-full h-12 text-base font-semibold transition-all duration-300',
            popular
              ? 'bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-primary-foreground border-0'
              : 'bg-surface hover:bg-surface/80 text-foreground border-0'
          )}
        >
          <Link to={buttonLink}>
            {buttonText}
            {title === 'Enterprise' && <ArrowRight className="ml-2 w-4 h-4" />}
          </Link>
        </Button>
      )}
    </div>
  </motion.div>
);

export const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]" />
      </div>

      <main className="relative z-10">
        {/* Navigation Placeholder (Logo) */}
        <header className="container mx-auto px-6 py-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-blue-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">The New Fuse</span>
          </Link>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground hover:bg-surface"
              asChild
            >
              <Link to="/auth/login">Sign In</Link>
            </Button>
            <Button className="bg-foreground text-background hover:bg-foreground/90" asChild>
              <Link to="/auth/register">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-16 text-center container mx-auto px-4">
          <div className="animate-fade-in">
            <Badge className="mb-6 bg-surface text-primary border-primary/20 hover:bg-surface/80 px-4 py-1.5 text-sm">
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-5xl md:text-7xl font-heading font-extrabold mb-6 tracking-tight">
              Ready to Supercharge <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-blue-500">
                Your Workflow?
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Join thousands of developers and teams building the future with The New Fuse. Start
              for free, upgrade when you need to scale.
            </p>

            {/* Toggle (Visual Only) */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <span
                className={cn(
                  'text-sm font-medium',
                  !isAnnual ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-8 rounded-full bg-surface p-1 relative transition-colors hover:bg-surface/80"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full bg-foreground shadow-sm transition-transform duration-300 ease-spring',
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  )}
                />
              </button>
              <span
                className={cn(
                  'text-sm font-medium',
                  isAnnual ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                Annual <span className="text-success text-xs ml-1">(Save 20%)</span>
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-4 pb-32">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <PricingCard
              title="Starter"
              price="$0"
              description="Perfect for hobbyists and side projects."
              buttonText="Get Started Free"
              buttonLink="/auth/register"
              features={[
                'Up to 5 AI Agents',
                'Basic Workflow Automation',
                'Community Support',
                '1,000 Messages/Month',
                'Basic Analytics',
              ]}
            />
            <PricingCard
              title="Professional"
              price="$30"
              description="For growing teams and serious developers."
              buttonText="Upgrade to Professional"
              buttonLink="/auth/register"
              popular={true}
              isPro={true}
              features={[
                'Up to 25 AI Agents',
                'Advanced Workflow Automation',
                'Priority Support',
                '10,000 Messages/Month',
                'Full API Access',
                'Team Collaboration',
                'Custom Branding',
              ]}
            />
            <PricingCard
              title="Enterprise"
              price="Custom"
              description="Scalable solutions for large organizations."
              buttonText="Contact Sales"
              buttonLink="/contact"
              features={[
                'Unlimited AI Agents',
                'Enterprise Security',
                '24/7 Dedicated Support',
                'Unlimited Usage',
                'Custom Integrations',
                'SLA Guarantees',
                'On-premise Deployment',
              ]}
            />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-24 border-t border-border">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-in-up">
            <h2 className="text-3xl font-heading font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Everything you need to know about billing and plans.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid gap-6">
            {[
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards including Visa, Mastercard, and American Express via PayPal. For Enterprise plans, we also support bank transfers.',
              },
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes, you can cancel your subscription at any time from your dashboard. Your access will continue until the end of the current billing period.',
              },
              {
                q: 'Is there a free trial for the Pro plan?',
                a: "Currently, we offer a generous Free Starter plan so you can test the platform. When you're ready for more power, you can upgrade to Pro.",
              },
              {
                q: 'Do you offer refunds?',
                a: "If you're not satisfied with The New Fuse, please contact our support team within 7 days of purchase.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-surface rounded-xl p-6 hover:bg-surface/80 transition-colors text-left border border-border/50"
              >
                <h3 className="font-semibold text-lg mb-2 text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-surface/30 py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-blue-600 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-heading font-bold text-xl">The New Fuse</span>
                </Link>
                <p className="text-muted-foreground max-w-sm">
                  The ultimate AI agent orchestration platform. Build, deploy, and scale intelligent
                  workflows with ease.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Product</h4>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li>
                    <Link to="/features" className="hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="hover:text-foreground transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs" className="hover:text-foreground transition-colors">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/changelog" className="hover:text-foreground transition-colors">
                      Changelog
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4">Company</h4>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  <li>
                    <Link to="/about" className="hover:text-foreground transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className="hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/careers" className="hover:text-foreground transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="hover:text-foreground transition-colors">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} The New Fuse. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Pricing;
