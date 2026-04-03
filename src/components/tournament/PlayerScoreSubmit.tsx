import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Check, CircleNotch, ClockCountdown, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { matchAPI } from "@/services/api";

interface PlayerScoreSubmitProps {
  match: any;
  currentUserId: string;
  onSuccess: () => void;
}

const PlayerScoreSubmit = ({ match, currentUserId, onSuccess }: PlayerScoreSubmitProps) => {
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if currentUserId is on team1 or team2
  let isOnTeam1 = false;
  let isOnTeam2 = false;

  if (match.team1) {
    if (match.team1Model === "User") {
      isOnTeam1 = match.team1._id?.toString() === currentUserId || match.team1?.toString() === currentUserId;
    } else {
      const players: any[] = match.team1.players || [];
      isOnTeam1 = players.some(
        (p: any) => p._id?.toString() === currentUserId || p.toString() === currentUserId
      );
    }
  }

  if (match.team2) {
    if (match.team2Model === "User") {
      isOnTeam2 = match.team2._id?.toString() === currentUserId || match.team2?.toString() === currentUserId;
    } else {
      const players: any[] = match.team2.players || [];
      isOnTeam2 = players.some(
        (p: any) => p._id?.toString() === currentUserId || p.toString() === currentUserId
      );
    }
  }

  // Not a participant — render nothing
  if (!isOnTeam1 && !isOnTeam2) return null;

  const myTeamKey = isOnTeam1 ? "team1" : "team2";
  const alreadySubmitted = match.scoreSubmission?.[myTeamKey]?.submitted === true;
  const otherTeamKey = isOnTeam1 ? "team2" : "team1";
  const otherSubmitted = match.scoreSubmission?.[otherTeamKey]?.submitted === true;

  // Show different state if disputed
  if (match.status === "disputed") {
    const s1 = match.scoreSubmission?.team1;
    const s2 = match.scoreSubmission?.team2;
    return (
      <div className="mt-3 p-3 rounded-xl border border-orange-500/40 bg-orange-500/10 space-y-1.5">
        <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm">
          <Warning className="w-4 h-4" />
          Score Dispute — Awaiting Organizer Resolution
        </div>
        {s1?.submitted && s2?.submitted && (
          <p className="text-xs text-muted-foreground">
            Team 1 reported: {s1.team1Score}–{s1.team2Score} | Team 2 reported: {s2.team1Score}–{s2.team2Score}
          </p>
        )}
      </div>
    );
  }

  // Show submitted-waiting state
  if (alreadySubmitted) {
    return (
      <div className="mt-3 p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ClockCountdown className="w-4 h-4" />
          Score Submitted — Waiting for Opponent
        </div>
        {otherSubmitted && (
          <p className="text-xs text-muted-foreground">Both teams have submitted. Processing…</p>
        )}
      </div>
    );
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await matchAPI.submitPlayerScore(match._id, { team1Score, team2Score });
      toast.success("Score submitted successfully");
      setShowConfirm(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit score");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mt-3 p-3 rounded-xl border border-border/50 bg-muted/20 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submit Your Score</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">
              {match.team1?.name || "Team 1"} Score
            </Label>
            <Input
              type="number"
              min={0}
              value={team1Score}
              onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
              className="h-9 text-center font-display font-bold"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              {match.team2?.name || "Team 2"} Score
            </Label>
            <Input
              type="number"
              min={0}
              value={team2Score}
              onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
              className="h-9 text-center font-display font-bold"
            />
          </div>
        </div>
        <Button
          size="sm"
          className="w-full h-8"
          onClick={() => setShowConfirm(true)}
        >
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Submit Score
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Score Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Once you save your score, you cannot edit it. Your opponent must also confirm their score. Are you sure you want to submit{" "}
              <strong>
                {match.team1?.name || "Team 1"} {team1Score} – {team2Score} {match.team2?.name || "Team 2"}
              </strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <CircleNotch className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Yes, Submit Score
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PlayerScoreSubmit;
