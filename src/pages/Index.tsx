import FeaturedTournamentsSection from "@/components/home/FeaturedTournamentsSection";
import HeroSection from "@/components/home/HeroSection";
import LiveNowStrip from "@/components/home/LiveNowStrip";
import SocialProofBar from "@/components/home/SocialProofBar";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import Layout from "@/components/layout/Layout";

const Index = () => {
  return (
    <Layout>
      <LiveNowStrip />
      <HeroSection />
      <SocialProofBar />
      <FeaturedTournamentsSection />
      <TestimonialsSection />
    </Layout>
  );
};

export default Index;
