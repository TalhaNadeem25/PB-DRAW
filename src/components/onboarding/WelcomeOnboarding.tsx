import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, User, Users, CaretRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const ONBOARDING_DISMISSED_KEY = "picklix_welcome_dismissed";

export function getWelcomeDismissed(): boolean {
  if (typeof sessionStorage === "undefined") return true;
  return sessionStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
}

export function setWelcomeDismissed(): void {
  sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
}

interface WelcomeOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WelcomeOnboarding({ open, onOpenChange }: WelcomeOnboardingProps) {
  const handleDismiss = () => {
    setWelcomeDismissed();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border">
        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-display font-bold">
            Welcome to Picklix
          </DialogTitle>
          <DialogDescription className="text-center">
            You&apos;re all set. Here are some quick next steps:
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 py-4">
          <li className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <User className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">Complete your profile so organizers can see your skill level.</span>
          </li>
          <li className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Trophy className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">Browse tournaments below and register for your first event.</span>
          </li>
          <li className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm">Need a partner? Use Find Partner to connect with other players.</span>
          </li>
        </ul>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleDismiss}>
            Maybe later
          </Button>
          <Button className="w-full sm:w-auto" asChild>
            <Link to="/profile" onClick={handleDismiss}>
              Complete profile <CaretRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
