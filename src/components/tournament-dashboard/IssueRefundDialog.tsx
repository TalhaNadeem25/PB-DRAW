import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Warning, CurrencyDollar, CircleNotch } from "@phosphor-icons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventAPI, cancellationAPI } from "@/services/api";
import { toast } from "sonner";

interface IssueRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  onSuccess?: () => void;
}

export default function IssueRefundDialog({
  open,
  onOpenChange,
  tournamentId,
  onSuccess,
}: IssueRefundDialogProps) {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [removeFromEvent, setRemoveFromEvent] = useState(true);
  const [confirmStep, setConfirmStep] = useState<"form" | "confirm">("form");

  // Fetch events for the tournament
  const { data: eventsData } = useQuery({
    queryKey: ["tournament-events", tournamentId],
    queryFn: () => eventAPI.getByTournament(tournamentId),
    enabled: open && !!tournamentId,
  });

  const events = eventsData?.data || [];

  // Get the selected event
  const selectedEvent = events.find((e: any) => e._id === selectedEventId);

  // Build player list from selected event's registrations
  const playerOptions: Array<{ label: string; paymentId: string; amount: number }> = [];
  if (selectedEvent) {
    if (selectedEvent.format === "singles" && selectedEvent.registeredPlayers) {
      for (const reg of selectedEvent.registeredPlayers) {
        const player = reg.player;
        if (player && reg.payment) {
          playerOptions.push({
            label: typeof player === "string" ? player : player.name || player.email || "Unknown",
            paymentId: typeof reg.payment === "string" ? reg.payment : reg.payment._id,
            amount: typeof reg.payment === "object" ? reg.payment.amount / 100 : 0,
          });
        }
      }
    }
    if (selectedEvent.teams) {
      for (const team of selectedEvent.teams) {
        const t = typeof team === "object" ? team : null;
        if (t) {
          const teamName = t.name || t.players?.map((p: any) => p.name || "Player").join(" / ") || "Team";
          if (t.payment) {
            playerOptions.push({
              label: teamName,
              paymentId: typeof t.payment === "string" ? t.payment : t.payment._id,
              amount: typeof t.payment === "object" ? t.payment.amount / 100 : 0,
            });
          }
        }
      }
    }
  }

  const selectedPlayer = playerOptions.find((p) => p.paymentId === selectedPaymentId);
  const maxAmount = selectedPlayer?.amount || 0;

  const refundMutation = useMutation({
    mutationFn: () =>
      cancellationAPI.organizerRefund(selectedPaymentId, {
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason,
        removeFromEvent,
      }),
    onSuccess: () => {
      toast.success("Refund processed successfully");
      queryClient.invalidateQueries({ queryKey: ["tournament-cancellations", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament-events", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      handleClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process refund");
      setConfirmStep("form");
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setSelectedEventId("");
    setSelectedPaymentId("");
    setRefundAmount("");
    setReason("");
    setRemoveFromEvent(true);
    setConfirmStep("form");
  };

  const handleSubmit = () => {
    if (confirmStep === "form") {
      setConfirmStep("confirm");
    } else {
      refundMutation.mutate();
    }
  };

  const canSubmit =
    selectedPaymentId && reason.trim().length > 0 && !refundMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <CurrencyDollar className="w-5 h-5 text-primary" />
            Issue Refund
          </DialogTitle>
          <DialogDescription>
            Select a player and process a refund for their registration payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label className="font-display font-semibold text-sm">Event</Label>
            <Select
              value={selectedEventId}
              onValueChange={(v) => {
                setSelectedEventId(v);
                setSelectedPaymentId("");
                setRefundAmount("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event: any) => (
                  <SelectItem key={event._id} value={event._id}>
                    {event.name} ({event.format})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Player/Team Selection */}
          {selectedEventId && (
            <div className="space-y-2">
              <Label className="font-display font-semibold text-sm">Player / Team</Label>
              {playerOptions.length > 0 ? (
                <Select
                  value={selectedPaymentId}
                  onValueChange={(v) => {
                    setSelectedPaymentId(v);
                    const player = playerOptions.find((p) => p.paymentId === v);
                    if (player) setRefundAmount(player.amount.toFixed(2));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player..." />
                  </SelectTrigger>
                  <SelectContent>
                    {playerOptions.map((option) => (
                      <SelectItem key={option.paymentId} value={option.paymentId}>
                        {option.label} {option.amount > 0 ? `($${option.amount.toFixed(2)})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No paid registrations found for this event.
                </p>
              )}
            </div>
          )}

          {/* Refund Amount */}
          {selectedPaymentId && (
            <div className="space-y-2">
              <Label className="font-display font-semibold text-sm">
                Refund Amount (max: ${maxAmount.toFixed(2)})
              </Label>
              <div className="relative">
                <CurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="pl-9"
                  placeholder={maxAmount.toFixed(2)}
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label className="font-display font-semibold text-sm">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Reason for issuing this refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Remove from event */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="remove-from-event"
              checked={removeFromEvent}
              onCheckedChange={(checked) => setRemoveFromEvent(checked as boolean)}
            />
            <Label htmlFor="remove-from-event" className="text-sm cursor-pointer">
              Remove player from event after refund
            </Label>
          </div>

          {/* Confirmation warning */}
          {confirmStep === "confirm" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
              <Warning className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive font-medium">
                Are you sure? This will process a ${refundAmount || maxAmount.toFixed(2)} refund
                via Stripe. This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={confirmStep === "confirm" ? () => setConfirmStep("form") : handleClose}
            disabled={refundMutation.isPending}
          >
            {confirmStep === "confirm" ? "Go Back" : "Cancel"}
          </Button>
          <Button
            variant={confirmStep === "confirm" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {refundMutation.isPending ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : confirmStep === "confirm" ? (
              "Confirm Refund"
            ) : (
              "Issue Refund"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
