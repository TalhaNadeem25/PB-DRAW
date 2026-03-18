import FeaturedTournamentsSection from "@/components/home/FeaturedTournamentsSection";
import HeroSection from "@/components/home/HeroSection";
import LiveNowStrip from "@/components/home/LiveNowStrip";
import SocialProofBar from "@/components/home/SocialProofBar";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || isLoading) return;
    navigate(isAuthenticated ? "/dashboard" : "/tournaments", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (Capacitor.isNativePlatform()) return null;

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
