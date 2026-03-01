import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import { Link, useLocation } from "react-router-dom";
import { UserPlus, LogIn } from "lucide-react";

interface AuthGateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function AuthGate({ title, description, icon }: AuthGateProps) {
  const location = useLocation();
  const loginTo = `/login?redirect=${encodeURIComponent(location.pathname)}`;
  const signupTo = `/signup?redirect=${encodeURIComponent(location.pathname)}`;

  return (
    <Layout>
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
            {icon && (
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                {title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {description}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild className="rounded-xl font-display font-bold uppercase tracking-widest">
                <Link to={signupTo}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign up
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl font-display font-bold uppercase tracking-widest">
                <Link to={loginTo}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Log in
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
