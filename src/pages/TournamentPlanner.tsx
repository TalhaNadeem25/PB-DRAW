import Layout from "@/components/layout/Layout";
import PicklixAIChatInterface from "@/components/tournament/PicklixAIChatInterface";
import { Sparkle } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TournamentPlanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight">Picklix AI</h1>
          <p className="text-muted-foreground max-w-sm">Sign in to start chatting with Picklix AI.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="border-b border-border/60 bg-card/50 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-black text-base uppercase tracking-tight leading-none">
              Picklix AI
            </h1>
            <p className="text-xs text-muted-foreground">
              Create tournaments, leagues, plan events — just ask
            </p>
          </div>
        </div>

        {/* Chat takes remaining height */}
        <div className="flex-1 overflow-hidden">
          <PicklixAIChatInterface />
        </div>
      </div>
    </Layout>
  );
};

export default TournamentPlanner;
