import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancellationAPI } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface BulkRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  tournamentName: string;
  onSuccess?: () => void;
}

export default function BulkRefundDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  onSuccess,
}: BulkRefundDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");

  const bulkRefundMutation = useMutation({
    mutationFn: () => cancellationAPI.bulkRefundTournament(tournamentId, reason),
    onSuccess: (data) => {
      const result = data.data;
      toast.success(
        `Tournament cancelled. ${result?.paymentsProcessed || 0} refund(s) processed ($${result?.totalRefunded?.toFixed(2) || "0.00"} total).`
      );
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-cancellations", tournamentId] });
      onOpenChange(false);
      setReason("");
      setConfirmName("");
      onSuccess?.();
      navigate("/tournaments");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cancel tournament");
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setReason("");
    setConfirmName("");
  };

  const canSubmit =
    reason.trim().length > 0 &&
    confirmName.trim().toLowerCase() === tournamentName.trim().toLowerCase() &&
    !bulkRefundMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <XCircle className="w-5 h-5 text-destructive" />
            Cancel Tournament
          </DialogTitle>
          <DialogDescription>
            This will cancel <strong>{tournamentName}</strong> and issue full
            refunds to all registered players. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive mb-1">Irreversible Action</p>
              <ul className="text-muted-foreground space-y-1">
                <li>All registered players will receive full refunds</li>
                <li>All registrations will be removed</li>
                <li>Tournament status will be set to "Cancelled"</li>
              </ul>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="bulk-reason" className="font-display font-semibold text-sm">
              Reason for cancellation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bulk-reason"
              placeholder="Explain why the tournament is being cancelled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Type tournament name to confirm */}
          <div className="space-y-2">
            <Label htmlFor="confirm-name" className="font-display font-semibold text-sm">
              Type <span className="font-bold text-destructive">"{tournamentName}"</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              placeholder={tournamentName}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={bulkRefundMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => bulkRefundMutation.mutate()}
            disabled={!canSubmit}
          >
            {bulkRefundMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Refunds...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Tournament & Refund All
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
