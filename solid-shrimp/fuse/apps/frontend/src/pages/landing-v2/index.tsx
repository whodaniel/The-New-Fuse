import FinalCTA from './components/FinalCTA';
import Hero from './components/Hero';
import Pricing from './components/Pricing';
import ProblemSolution from './components/ProblemSolution';
import ProductShowcase from './components/ProductShowcase';
import SocialProof from './components/SocialProof';
import LandingLayout from './layout';

export default function LandingPageV2() {
  return (
    <LandingLayout>
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <ProductShowcase />
      <Pricing />
      <FinalCTA />

      {/* Simple Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-sm text-white/20">
        © 2025 The New Fuse. All rights reserved.
      </footer>
    </LandingLayout>
  );
}
