import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import AIPlannerSection from "@/components/home/AIPlannerSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <AIPlannerSection />
      <HowItWorksSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
