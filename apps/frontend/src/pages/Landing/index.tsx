import { useNavigate } from 'react-router-dom';
import MobileNav from '../../components/MobileNav';
import {
  defaultStats,
  defaultTestimonials,
  defaultTrustBadges,
  EmailSignupForm,
  FeatureShowcase,
  HeroCTAWithTrust,
  SecondaryCTA,
  SocialProofSection,
} from '../../components/landing';

export default function LandingPage() {
  const navigate = useNavigate();

  // Form submission handlers
  const handleEmailSignup = async (email: string, type: string) => {
    // TODO: Implement email signup API call
    console.log('Email signup:', { email, type });
    return new Promise<void>((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation */}
      <MobileNav />

      {/* Hero Section - Mobile First */}
      <section
        id="hero"
        className="relative pt-24 pb-16 px-4 sm:px-6 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32"
      >
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left animate-slide-in-up">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
                Welcome to <span className="text-primary">The New Fuse</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto lg:mx-0">
                Discover a new way to collaborate and manage your workspaces efficiently. Build
                powerful AI-driven workflows with ease.
              </p>
              {/* CTA Buttons - Enhanced with new components */}
              <div className="flex justify-center lg:justify-start">
                <HeroCTAWithTrust
                  onGetStarted={() => navigate('/login')}
                  onWatchDemo={() => {
                    /* Demo handler */
                  }}
                  stats={{ users: '10,000+', rating: '4.9/5' }}
                />
              </div>
            </div>
            {/* Hero Image - Responsive */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none animate-slide-in-right">
              <div className="relative aspect-square md:aspect-video rounded-lg bg-linear-to-br from-primary/20 to-accent/20 backdrop-blur-sm p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 md:w-16 md:h-16 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base">Powered by AI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced with new components */}
      <FeatureShowcase />

      {/* Social Proof Section */}
      <SocialProofSection
        stats={defaultStats}
        testimonials={defaultTestimonials}
        trustBadges={defaultTrustBadges}
      />

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 md:py-24">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 animate-slide-in-left">
              <div className="aspect-video rounded-lg bg-linear-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <p className="text-muted-foreground">About Illustration</p>
              </div>
            </div>
            <div className="flex-1 animate-slide-in-right">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                Built for the Future
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6">
                The New Fuse combines cutting-edge AI technology with an intuitive interface to help
                you build, deploy, and manage intelligent automation workflows.
              </p>
              <ul className="space-y-3">
                {[
                  'Enterprise-ready infrastructure',
                  'Scalable multi-agent architecture',
                  'Real-time collaboration tools',
                  'Comprehensive API documentation',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-primary shrink-0 mt-0.5"
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
                    <span className="text-base text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 md:py-24 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Simple Pricing
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                features: [
                  'Up to 5 AI Agents',
                  'Basic Workflow Automation',
                  'Community Support',
                  '1,000 Messages/Month',
                  'Basic Analytics',
                ],
                cta: '/auth/register',
                ctaText: 'Get Started Free',
              },
              {
                name: 'Pro',
                price: '$30/mo',
                features: [
                  'Up to 25 AI Agents',
                  'Advanced Workflow Automation',
                  'Priority Support',
                  '10,000 Messages/Month',
                  'Advanced Analytics',
                  'API Access',
                ],
                highlighted: true,
                cta: '/auth/register',
                ctaText: 'Upgrade to Professional',
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                features: [
                  'Unlimited AI Agents',
                  'Enterprise Workflows',
                  '24/7 Dedicated Support',
                  'Unlimited Messages',
                  'Custom Integrations',
                  'SLA Guarantees',
                ],
                cta: '/contact',
                ctaText: 'Contact Sales',
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-background rounded-lg p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border ${
                  plan.highlighted ? 'border-primary scale-105' : 'border-border'
                }`}
              >
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-3xl md:text-4xl font-bold text-primary mb-6">{plan.price}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-primary shrink-0 mt-0.5"
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
                      <span className="text-base text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(plan.cta)}
                  className={`w-full min-h-touch rounded-md px-6 py-3 text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary CTA Section */}
      <SecondaryCTA
        variant="gradient"
        title="Ready to Transform Your Workflow?"
        description="Join thousands of teams already using The New Fuse to streamline their agent-to-agent collaboration."
        benefits={[
          'Set up in minutes, not hours',
          'No coding required',
          'Cancel anytime',
          '24/7 customer support',
        ]}
        ctaText="Start Your Free Trial"
        onCtaClick={() => navigate('/login')}
      />

      {/* Email Signup Section */}
      <section id="contact" className="py-16 px-4 sm:px-6 md:py-24">
        <div className="container mx-auto max-w-4xl">
          <EmailSignupForm
            title="Stay Updated"
            description="Get the latest updates, tips, and exclusive content delivered to your inbox."
            placeholder="Enter your email address"
            buttonText="Subscribe"
            type="newsletter"
            onSubmit={handleEmailSignup}
            showPrivacyNote={true}
          />
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-muted/50 border-t border-border py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">The New Fuse</h3>
              <p className="text-base text-muted-foreground">
                Building the future of AI-powered automation.
              </p>
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#about"
                    className="text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-base text-muted-foreground hover:text-foreground transition-colors min-h-touch inline-block"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-base text-muted-foreground">
              © 2025 The New Fuse. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
