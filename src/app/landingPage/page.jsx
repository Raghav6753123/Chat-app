import LandingNav from './components/nav';
import HeroSection from './components/Hero';
import FeaturesSection from './components/Features';
import TestimonialsSection from './components/testimonial';
import PricingSection from './components/Pricing';
import LandingFooter from './components/footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <LandingFooter />
    </main>
  );
}