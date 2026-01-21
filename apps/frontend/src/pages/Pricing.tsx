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
      'relative flex flex-col p-8 rounded-2xl border transition-all duration-300',
      popular
        ? 'bg-white/5 border-purple-500/50 shadow-[0_0_50px_-10px_rgba(168,85,247,0.2)]'
        : 'bg-white/5 border-white/10 hover:border-white/20'
    )}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Badge className="bg-linear-to-r from-purple-500 to-blue-500 text-white border-0 px-4 py-1">
          Most Popular
        </Badge>
      </div>
    )}

    <div className="mb-8">
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm h-10">{description}</p>
    </div>

    <div className="mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        {price !== 'Custom' && price !== 'Free' && <span className="text-gray-400">/month</span>}
      </div>
    </div>

    <ul className="space-y-4 mb-8 flex-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="mt-1 bg-green-500/10 rounded-full p-1">
            <Check className="w-3 h-3 text-green-400" />
          </div>
          <span className="text-sm text-gray-300">{feature}</span>
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
              ? 'bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0'
              : 'bg-white/10 hover:bg-white/20 text-white border-0'
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
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
      </div>

      <main className="relative z-10">
        {/* Navigation Placeholder (Logo) */}
        <header className="container mx-auto px-6 py-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">The New Fuse</span>
          </Link>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link to="/auth/login">Sign In</Link>
            </Button>
            <Button className="bg-white text-black hover:bg-gray-200" asChild>
              <Link to="/auth/register">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-16 text-center container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-white/5 text-purple-300 border-purple-500/20 hover:bg-white/10 px-4 py-1.5 text-sm">
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-white/70 tracking-tight">
              Ready to Supercharge <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-400">
                Your Workflow?
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              Join thousands of developers and teams building the future with The New Fuse. Start
              for free, upgrade when you need to scale.
            </p>

            {/* Toggle (Visual Only) */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <span
                className={cn('text-sm font-medium', !isAnnual ? 'text-white' : 'text-gray-500')}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-8 rounded-full bg-white/10 p-1 relative transition-colors hover:bg-white/20"
              >
                <motion.div
                  className="w-6 h-6 rounded-full bg-white"
                  animate={{ x: isAnnual ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span
                className={cn('text-sm font-medium', isAnnual ? 'text-white' : 'text-gray-500')}
              >
                Annual <span className="text-green-400 text-xs ml-1">(Save 20%)</span>
              </span>
            </div>
          </motion.div>
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
        <section className="container mx-auto px-4 py-24 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about billing and plans.</p>
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
                className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors text-left"
              >
                <h3 className="font-semibold text-lg mb-2 text-white">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-[#05080F] py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-xl">The New Fuse</span>
                </Link>
                <p className="text-gray-400 max-w-sm">
                  The ultimate AI agent orchestration platform. Build, deploy, and scale intelligent
                  workflows with ease.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li>
                    <Link to="/features" className="hover:text-white transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="hover:text-white transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/docs" className="hover:text-white transition-colors">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/changelog" className="hover:text-white transition-colors">
                      Changelog
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li>
                    <Link to="/about" className="hover:text-white transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className="hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/careers" className="hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="hover:text-white transition-colors">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} The New Fuse. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-500">
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="hover:text-white transition-colors">
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
