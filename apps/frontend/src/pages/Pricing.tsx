import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Rocket, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingCard = ({
  title,
  price,
  description,
  features,
  popular = false,
  buttonText,
  buttonLink,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonLink: string;
}) => (
  <Card
    className={`flex flex-col h-full ${popular ? 'border-2 border-blue-500 shadow-xl' : 'border border-gray-200'}`}
  >
    <CardHeader className="text-center">
      <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      {popular && <Badge className="bg-blue-500 text-white mt-2">Most Popular</Badge>}
      <div className="my-4">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-500">/month</span>
      </div>
      <CardDescription className="text-sm">{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow">
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="w-full">
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </CardContent>
  </Card>
);

export const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="flex-grow" role="main">
        {/* Hero Section */}
        <section
          className="relative py-20 lg:py-32 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 text-white overflow-hidden"
          aria-labelledby="pricing-hero-heading"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>

          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-5xl mx-auto">
              <Badge
                className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
                aria-label="Pricing badge"
              >
                <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
                Transparent Pricing
              </Badge>

              <h1
                id="pricing-hero-heading"
                className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                Simple, Fair Pricing
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  for Every Team
                </span>
              </h1>

              <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto leading-relaxed">
                Choose the perfect plan for your AI collaboration needs. Start free, scale as you
                grow.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                role="group"
                aria-label="Call to action buttons"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                  aria-label="Get started with The New Fuse pricing"
                >
                  <Link to="/auth/register">
                    <Rocket
                      className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      aria-hidden="true"
                    />
                    Get Started Free
                    <ArrowRight
                      className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                  aria-label="Contact sales"
                >
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="pricing-plans-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="Pricing plans">
                Pricing Plans
              </Badge>
              <h2
                id="pricing-plans-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              >
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Simple, transparent pricing with no hidden fees. Cancel anytime.
              </p>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
              role="list"
              aria-label="Pricing plans"
            >
              {/* Free Plan */}
              <PricingCard
                title="Starter"
                price="Free"
                description="Perfect for individuals and small teams getting started"
                features={[
                  'Up to 5 AI agents',
                  'Basic workflow automation',
                  'Community support',
                  '1,000 messages/month',
                  'Basic analytics',
                  'Email support',
                ]}
                buttonText="Get Started Free"
                buttonLink="/auth/register"
              />

              {/* Professional Plan */}
              <PricingCard
                title="Professional"
                price="$49"
                description="For growing teams and serious developers"
                popular={true}
                features={[
                  'Up to 25 AI agents',
                  'Advanced workflow automation',
                  'Priority support',
                  '10,000 messages/month',
                  'Advanced analytics',
                  'API access',
                  'Team collaboration',
                  'Custom branding',
                ]}
                buttonText="Upgrade to Professional"
                buttonLink="/auth/register"
              />

              {/* Enterprise Plan */}
              <PricingCard
                title="Enterprise"
                price="Custom"
                description="For large organizations with advanced needs"
                features={[
                  'Unlimited AI agents',
                  'Enterprise workflow automation',
                  '24/7 dedicated support',
                  'Unlimited messages',
                  'Advanced analytics & reporting',
                  'Full API access',
                  'Team collaboration',
                  'Custom branding',
                  'SLA guarantees',
                  'Custom integrations',
                  'Dedicated account manager',
                ]}
                buttonText="Contact Sales"
                buttonLink="/contact"
              />
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Need a custom plan?{' '}
                <Link to="/contact" className="text-blue-600 hover:underline">
                  Contact our sales team
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                All plans include our 30-day money-back guarantee
              </p>
            </div>
          </div>
        </section>

        {/* Features Comparison */}
        <section className="py-20 bg-white" aria-labelledby="features-comparison-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="Features comparison">
                Features Comparison
              </Badge>
              <h2
                id="features-comparison-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              >
                What's Included in Each Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Compare features across all our pricing tiers
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Starter</th>
                    <th className="text-center p-4 font-semibold">Professional</th>
                    <th className="text-center p-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'AI Agents',
                      starter: '5',
                      professional: '25',
                      enterprise: 'Unlimited',
                    },
                    {
                      name: 'Messages/Month',
                      starter: '1,000',
                      professional: '10,000',
                      enterprise: 'Unlimited',
                    },
                    {
                      name: 'Workflow Automation',
                      starter: 'Basic',
                      professional: 'Advanced',
                      enterprise: 'Enterprise',
                    },
                    {
                      name: 'Support',
                      starter: 'Community',
                      professional: 'Priority',
                      enterprise: '24/7 Dedicated',
                    },
                    {
                      name: 'Analytics',
                      starter: 'Basic',
                      professional: 'Advanced',
                      enterprise: 'Advanced + Custom',
                    },
                    { name: 'API Access', starter: '❌', professional: '✅', enterprise: '✅' },
                    {
                      name: 'Team Collaboration',
                      starter: '❌',
                      professional: '✅',
                      enterprise: '✅',
                    },
                    {
                      name: 'Custom Branding',
                      starter: '❌',
                      professional: '✅',
                      enterprise: '✅',
                    },
                    { name: 'SLA Guarantees', starter: '❌', professional: '❌', enterprise: '✅' },
                    {
                      name: 'Custom Integrations',
                      starter: '❌',
                      professional: '❌',
                      enterprise: '✅',
                    },
                    {
                      name: 'Dedicated Account Manager',
                      starter: '❌',
                      professional: '❌',
                      enterprise: '✅',
                    },
                  ].map((feature, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-4 font-medium">{feature.name}</td>
                      <td className="p-4 text-center">{feature.starter}</td>
                      <td className="p-4 text-center">{feature.professional}</td>
                      <td className="p-4 text-center">{feature.enterprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="FAQ">
                FAQ
              </Badge>
              <h2 id="faq-heading" className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Have questions about our pricing? We have answers.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border border-gray-200 rounded-lg">
                <button className="w-full text-left p-4 font-semibold hover:bg-gray-50 transition-colors">
                  What payment methods do you accept?
                </button>
                <div className="p-4 text-gray-600">
                  We accept all major credit cards (Visa, Mastercard, American Express) and can also
                  process payments via bank transfer for enterprise plans.
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button className="w-full text-left p-4 font-semibold hover:bg-gray-50 transition-colors">
                  Can I upgrade or downgrade my plan?
                </button>
                <div className="p-4 text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect
                  immediately and billing is prorated.
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button className="w-full text-left p-4 font-semibold hover:bg-gray-50 transition-colors">
                  Do you offer discounts for non-profits or educational institutions?
                </button>
                <div className="p-4 text-gray-600">
                  Yes, we offer special pricing for non-profits, educational institutions, and
                  open-source projects. Please contact our sales team for details.
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg">
                <button className="w-full text-left p-4 font-semibold hover:bg-gray-50 transition-colors">
                  What happens if I exceed my plan limits?
                </button>
                <div className="p-4 text-gray-600">
                  If you exceed your plan limits, we'll notify you and give you the option to
                  upgrade. We won't interrupt your service.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white"
          aria-labelledby="pricing-cta-heading"
        >
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 id="pricing-cta-heading" className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 mb-10">
                Choose your plan and start building with The New Fuse today.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                role="group"
                aria-label="Get started actions"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                  aria-label="Get started free with The New Fuse"
                >
                  <Link to="/auth/register">
                    Get Started Free
                    <ArrowRight
                      className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                  aria-label="Contact sales"
                >
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link
                to="/"
                className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">The New Fuse</span>
              </Link>
              <p className="text-gray-400 text-sm">AI Agent Orchestration Platform</p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/agents" className="hover:text-white transition-colors">
                    AI Agents
                  </Link>
                </li>
                <li>
                  <Link to="/workflows" className="hover:text-white transition-colors">
                    Workflows
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/community" className="hover:text-white transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/whodaniel/The-New-Fuse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link to="/legal/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/legal/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} The New Fuse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
