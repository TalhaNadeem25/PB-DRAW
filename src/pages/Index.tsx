import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import LogoStripSection from "@/components/home/LogoStripSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturedTournamentsSection from "@/components/home/FeaturedTournamentsSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <LogoStripSection />
      <HowItWorksSection />
      <FeaturedTournamentsSection />
    </Layout>
  );
};

export default Index;
