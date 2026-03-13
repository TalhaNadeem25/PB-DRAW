import FeaturedTournamentsSection from "@/components/home/FeaturedTournamentsSection";
import HeroSection from "@/components/home/HeroSection";
import LiveNowStrip from "@/components/home/LiveNowStrip";
import SocialProofBar from "@/components/home/SocialProofBar";
import Layout from "@/components/layout/Layout";

const Index = () => {
  return (
    <Layout>
      <LiveNowStrip />
      <HeroSection />
      <SocialProofBar />
      <FeaturedTournamentsSection />
    </Layout>
  );
};

export default Index;
