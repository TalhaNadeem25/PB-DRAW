import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export interface TournamentAlertDialogsProps {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  eventToDelete: string | null;
  setEventToDelete: (id: string | null) => void;
  onConfirmDeleteEvent: () => void;
  deleteEventPending: boolean;

  isDeleteTournamentDialogOpen: boolean;
  setIsDeleteTournamentDialogOpen: (open: boolean) => void;
  onConfirmDeleteTournament: () => void;
  deleteTournamentPending: boolean;

  isStartTournamentDialogOpen: boolean;
  setIsStartTournamentDialogOpen: (open: boolean) => void;
  onConfirmStartTournament: () => void;
  startTournamentPending: boolean;

  isCompleteTournamentDialogOpen: boolean;
  setIsCompleteTournamentDialogOpen: (open: boolean) => void;
  onConfirmCompleteTournament: () => void;
  completeTournamentPending: boolean;
}

export default function TournamentAlertDialogs({
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  eventToDelete,
  setEventToDelete,
  onConfirmDeleteEvent,
  deleteEventPending,
  isDeleteTournamentDialogOpen,
  setIsDeleteTournamentDialogOpen,
  onConfirmDeleteTournament,
  deleteTournamentPending,
  isStartTournamentDialogOpen,
  setIsStartTournamentDialogOpen,
  onConfirmStartTournament,
  startTournamentPending,
  isCompleteTournamentDialogOpen,
  setIsCompleteTournamentDialogOpen,
  onConfirmCompleteTournament,
  completeTournamentPending,
}: TournamentAlertDialogsProps) {
  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event and all associated data including teams, pools, and matches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setEventToDelete(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDeleteEvent} disabled={deleteEventPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteEventPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>) : "Yes, Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteTournamentDialogOpen} onOpenChange={setIsDeleteTournamentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tournament and all associated data including events, teams, pools, matches, and registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteTournamentDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDeleteTournament} disabled={deleteTournamentPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteTournamentPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>) : "Yes, Delete Tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isStartTournamentDialogOpen} onOpenChange={setIsStartTournamentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the tournament go live and appear on the "Live Tournaments" page. Players will see this tournament as "In Progress" and matches can begin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStartTournamentDialogOpen(false)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmStartTournament} disabled={startTournamentPending} className="bg-court-green text-white hover:bg-court-green-dark">
              {startTournamentPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>) : "Yes, Start Tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCompleteTournamentDialogOpen} onOpenChange={setIsCompleteTournamentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the tournament as finished. The status will change to "Completed" and it will no longer appear as a live tournament. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsCompleteTournamentDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmCompleteTournament} disabled={completeTournamentPending} className="bg-foreground text-background hover:bg-foreground/90">
              {completeTournamentPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Completing...</>) : "Yes, Complete Tournament"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
