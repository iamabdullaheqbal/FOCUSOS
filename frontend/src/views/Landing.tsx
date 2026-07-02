'use client'

import React from 'react';
import { LandingNavigation } from '../components/Landing/LandingNavigation';
import { HeroSection } from '../components/Landing/HeroSection';
import { TrustedMetrics } from '../components/Landing/TrustedMetrics';
import { ProductShowcase } from '../components/Landing/ProductShowcase';
import { InteractiveWorkflow } from '../components/Landing/InteractiveWorkflow';
import { HowItThinks } from '../components/Landing/HowItThinks';
import { AgentsSection } from '../components/Landing/AgentsSection';
import { WhyFocusOS } from '../components/Landing/WhyFocusOS';
import { InteractivePreview } from '../components/Landing/InteractivePreview';
import { Testimonials } from '../components/Landing/Testimonials';
import { FAQSection } from '../components/Landing/FAQSection';
import { CTASection } from '../components/Landing/CTASection';
import { LandingFooter } from '../components/Landing/LandingFooter';
import { Background } from '../components/Landing/Background';

export const Landing: React.FC = () => {
  return (
    <div className="bg-[#020617] min-h-screen text-gray-50 font-sans selection:bg-indigo-500/30 relative">
      <Background />
      <LandingNavigation />
      <main>
        <HeroSection />
        <TrustedMetrics />
        <ProductShowcase />
        <InteractiveWorkflow />
        <HowItThinks />
        <AgentsSection />
        <WhyFocusOS />
        <InteractivePreview />
        <Testimonials />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};
