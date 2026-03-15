import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { ArrowRight, Book, Clock, Headset, MessageCircle, Rocket } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const SupportOptionCard = ({
  icon: Icon,
  title,
  description,
  buttonText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  buttonText: string;
}) => (
  <GlassCard className="p-4">
    <div>
      <div className="w-12 h-12 rounded-md bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <PremiumButton variant="outline" size="sm">
        {buttonText}
      </PremiumButton>
    </div>
  </GlassCard>
);

export const Support = () => {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="grow">
        <section className="py-20 lg:py-22 bg-linear-to-br from-indigo-600 via-purple-700 to-blue-800 text-white text-center">
          <div className="container mx-auto px-4">
            <Badge className="mb-6 bg-transparent/10 text-white border-white/20">
              <Headset className="w-4 h-4 mr-2" />
              24/7 Support
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">Help & Support</h1>
            <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto">
              We're here to help with any questions or issues you may have.
            </p>
            <Link to="/auth/register">
              <PremiumButton
                size="lg"
                className="bg-transparent text-blue-600 hover:bg-blue-50 px-8 py-2 text-lg font-semibold"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </Link>
          </div>
        </section>

        <section className="py-20 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Support Options</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Choose the support method that works best for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SupportOptionCard
                icon={MessageCircle}
                title="Live Chat"
                description="Get instant help from our support team"
                buttonText="Start Chat"
              />
              <SupportOptionCard
                icon={Book}
                title="Documentation"
                description="Browse our comprehensive documentation"
                buttonText="View Docs"
              />
              <SupportOptionCard
                icon={Clock}
                title="24/7 Support"
                description="Enterprise support available anytime"
                buttonText="Contact Support"
              />
            </div>
          </div>
        </section>

        <section className="py-20 bg-transparent text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Need Immediate Help?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Our support team is available 24/7 to assist you.
            </p>
            <Link to="/auth/register">
              <PremiumButton
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-lg font-semibold"
              >
                Get Started
              </PremiumButton>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Support;
