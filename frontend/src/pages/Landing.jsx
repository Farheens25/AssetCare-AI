import Navbar from "../components/common/Navbar";

import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import AIFeatures from "../components/landing/AIFeatures";
import WhyAssetCare from "../components/landing/WhyAssetCare";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

function Landing() {
  return (
    <div>
      <Navbar />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <AIFeatures />
        <WhyAssetCare />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default Landing;