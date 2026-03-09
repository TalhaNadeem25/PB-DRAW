import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { tournamentAPI, teamAPI, eventAPI, cancellationAPI } from "@/services/api";
import { CircleNotch, Users, Envelope, Star, Calendar, CheckCircle, XCircle, ArrowRight, CurrencyDollar, Warning, User, Info, CaretDown } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatEventSkillLevel } from "@/types/tournament";
import { toast } from "sonner";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RegisteredPlayersProps {
  tournamentId: string;
}

const RegisteredPlayers = ({ tournamentId }: RegisteredPlayersProps) => {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [targetEventId, setTargetEventId] = useState<string>("");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<any>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundConfirmStep, setRefundConfirmStep] = useState<"form" | "confirm">("form");
  const [infoTarget, setInfoTarget] = useState<{ type: "player" | "team"; data: any; eventName: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tournament-registrations', tournamentId],
    queryFn: () => tournamentAPI.getRegistrations(tournamentId),
    enabled: !!tournamentId,
  });

  const moveTeamMutation = useMutation({
    mutationFn: ({ teamId, targetEventId }: { teamId: string; targetEventId: string }) =>
      teamAPI.moveToEvent(teamId, targetEventId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations', tournamentId] });
      setIsMoveDialogOpen(false);
      setSelectedItem(null);
      setTargetEventId("");
      toast.success(data.message || "Team moved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to move team");
    },
  });

  const movePlayerMutation = useMutation({
    mutationFn: ({ eventId, playerId, targetEventId }: { eventId: string; playerId: string; targetEventId: string }) =>
      eventAPI.movePlayerToEvent(eventId, playerId, targetEventId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations', tournamentId] });
      setIsMoveDialogOpen(false);
      setSelectedItem(null);
      setTargetEventId("");
      toast.success(data.message || "Player moved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to move player");
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) =>
      cancellationAPI.organizerRefund(paymentId, { reason, removeFromEvent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations', tournamentId] });
      queryClient.invalidateQueries({ queryKey: ['tournament-cancellations', tournamentId] });
      setIsRefundDialogOpen(false);
      setRefundTarget(null);
      setRefundReason("");
      setRefundConfirmStep("form");
      toast.success("Refund processed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to process refund");
      setRefundConfirmStep("form");
    },
  });

  const handleRefundClick = (item: any, type: 'team' | 'player') => {
    setRefundTarget({ ...item, type });
    setIsRefundDialogOpen(true);
  };

  const handleConfirmRefund = () => {
    if (refundConfirmStep === "form") {
      setRefundConfirmStep("confirm");
      return;
    }
    if (!refundTarget?.paymentId || !refundReason.trim()) return;
    refundMutation.mutate({ paymentId: refundTarget.paymentId, reason: refundReason });
  };

  const handleMoveClick = (item: any, currentEventId: string, type: 'team' | 'player') => {
    setSelectedItem({ ...item, currentEventId, type });
    setIsMoveDialogOpen(true);
  };

  const handleConfirmMove = () => {
    if (!targetEventId || !selectedItem) {
      toast.error("Please select a target event");
      return;
    }

    if (selectedItem.type === 'team') {
      moveTeamMutation.mutate({
        teamId: selectedItem.teamId,
        targetEventId,
      });
    } else {
      movePlayerMutation.mutate({
        eventId: selectedItem.currentEventId,
        playerId: selectedItem.playerId,
        targetEventId,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CircleNotch className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load registrations. Please try again.</p>
      </div>
    );
  }

  const registrations = data?.data || [];

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No players have registered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {registrations.map((event: any) => {
        const totalRegistrations = event.format === 'singles'
          ? event.registeredPlayers.length
          : event.teams.length;

        if (totalRegistrations === 0) return null;

        return (
          <div key={event.eventId} className="glass-card-hover rounded-2xl overflow-hidden">
            <div className="bg-hero-gradient p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-primary-foreground">
                    {event.eventName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize border-primary-foreground/30 text-primary-foreground">
                      {event.format.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                      {formatEventSkillLevel(event.skillLevel)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold text-primary-foreground">
                    {totalRegistrations}
                  </div>
                  <div className="text-sm text-primary-foreground/80">
                    {event.format === 'singles' ? 'Players' : 'Teams'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto">
              {event.format === 'singles' ? (
                // Singles Format - Show individual players
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Skill Level</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.registeredPlayers.map((player: any, idx: number) => (
                      <TableRow key={player.playerId} className={cn(idx % 2 === 0 && "bg-muted/30")}>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                              >
                                {player.name}
                                <CaretDown className="w-3 h-3 opacity-70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                              <DropdownMenuItem asChild>
                                <Link to={`/profile?userId=${player.playerId}`} className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  View profile
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setInfoTarget({ type: "player", data: player, eventName: event.eventName })}>
                                <Info className="w-4 h-4" />
                                View info
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleMoveClick(player, event.eventId, "player")}>
                                <ArrowRight className="w-4 h-4" />
                                Move to event
                              </DropdownMenuItem>
                              {player.paymentStatus === "paid" && player.paymentId && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleRefundClick(player, "player")}
                                >
                                  <CurrencyDollar className="w-4 h-4" />
                                  Refund & remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          <a href={`mailto:${player.email}`} className="text-primary hover:underline flex items-center gap-1">
                            <Envelope className="w-3 h-3" />
                            {player.email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Star className="w-3 h-3" />
                            {player.skillLevel || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {player.paymentStatus === 'paid' ? (
                            <Badge variant="default" className="bg-court-green text-white flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {player.registeredAt ? format(new Date(player.registeredAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveClick(player, event.eventId, 'player')}
                              className="flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Move
                            </Button>
                            {player.paymentStatus === 'paid' && player.paymentId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRefundClick(player, 'player')}
                                className="flex items-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                <CurrencyDollar className="w-3 h-3" />
                                Refund
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                // Doubles/Mixed Format - Show teams with partners
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Player 1</TableHead>
                      <TableHead>Player 2</TableHead>
                      <TableHead>Skill Levels</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.teams.map((team: any, idx: number) => (
                      <TableRow key={team.teamId} className={cn(idx % 2 === 0 && "bg-muted/30")}>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="font-semibold text-primary hover:underline cursor-pointer inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                              >
                                {team.teamName}
                                <CaretDown className="w-3 h-3 opacity-70" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                              <DropdownMenuItem onClick={() => setInfoTarget({ type: "team", data: team, eventName: event.eventName })}>
                                <Info className="w-4 h-4" />
                                View info
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleMoveClick(team, event.eventId, "team")}>
                                <ArrowRight className="w-4 h-4" />
                                Move to event
                              </DropdownMenuItem>
                              {team.paymentStatus === "paid" && team.paymentId && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleRefundClick(team, "team")}
                                >
                                  <CurrencyDollar className="w-4 h-4" />
                                  Refund & remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          {team.players[0] ? (
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded text-left"
                                  >
                                    {team.players[0].name}
                                    <CaretDown className="w-3 h-3 opacity-70" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52">
                                  <DropdownMenuItem asChild>
                                    <Link to={`/profile?userId=${team.players[0].playerId}`} className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      View profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setInfoTarget({ type: "player", data: team.players[0], eventName: event.eventName })}>
                                    <Info className="w-4 h-4" />
                                    View info
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <a href={`mailto:${team.players[0].email}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                                <Envelope className="w-3 h-3" />
                                {team.players[0].email}
                              </a>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {team.players[1] ? (
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="font-medium text-primary hover:underline cursor-pointer inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded text-left"
                                  >
                                    {team.players[1].name}
                                    <CaretDown className="w-3 h-3 opacity-70" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52">
                                  <DropdownMenuItem asChild>
                                    <Link to={`/profile?userId=${team.players[1].playerId}`} className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      View profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setInfoTarget({ type: "player", data: team.players[1], eventName: event.eventName })}>
                                    <Info className="w-4 h-4" />
                                    View info
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <a href={`mailto:${team.players[1].email}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                                <Envelope className="w-3 h-3" />
                                {team.players[1].email}
                              </a>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs">Needs Partner</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {team.players.map((player: any, pIdx: number) => (
                              <Badge key={pIdx} variant="secondary" className="flex items-center gap-1 w-fit">
                                <Star className="w-3 h-3" />
                                {player.skillLevel || 'N/A'}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {team.paymentStatus === 'paid' ? (
                            <Badge variant="default" className="bg-court-green text-white flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                            </Badge>
                          ) : team.paymentStatus === 'partially_paid' ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Calendar className="w-3 h-3" />
                              Partial
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" />
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {team.registeredAt ? format(new Date(team.registeredAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveClick(team, event.eventId, 'team')}
                              className="flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Move
                            </Button>
                            {team.paymentStatus === 'paid' && team.paymentId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRefundClick(team, 'team')}
                                className="flex items-center gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                <CurrencyDollar className="w-3 h-3" />
                                Refund
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );
      })}

      {/* View Info Dialog */}
      <Dialog open={!!infoTarget} onOpenChange={(open) => !open && setInfoTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{infoTarget?.type === "team" ? "Team info" : "Player info"}</DialogTitle>
            <DialogDescription>
              {infoTarget?.eventName && <span className="text-muted-foreground">Event: {infoTarget.eventName}</span>}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4">
            {infoTarget?.type === "player" && infoTarget.data && (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div className="font-semibold">{infoTarget.data.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <a href={`mailto:${infoTarget.data.email}`} className="text-primary hover:underline">
                    {infoTarget.data.email}
                  </a>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Skill level</div>
                  <Badge variant="secondary">{infoTarget.data.skillLevel || "N/A"}</Badge>
                </div>
                {infoTarget.data.registeredAt && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Registered</div>
                    <div>{format(new Date(infoTarget.data.registeredAt), "MMM dd, yyyy")}</div>
                  </div>
                )}
                {infoTarget.data.paymentStatus && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment</div>
                    <Badge variant={infoTarget.data.paymentStatus === "paid" ? "default" : "destructive"} className="bg-court-green">
                      {infoTarget.data.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            {infoTarget?.type === "team" && infoTarget.data && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Team name</div>
                  <div className="font-semibold">{infoTarget.data.teamName}</div>
                </div>
                {infoTarget.data.registeredAt && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Registered</div>
                    <div>{format(new Date(infoTarget.data.registeredAt), "MMM dd, yyyy")}</div>
                  </div>
                )}
                {infoTarget.data.paymentStatus && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment</div>
                    <Badge variant={infoTarget.data.paymentStatus === "paid" ? "default" : "destructive"} className="bg-court-green">
                      {infoTarget.data.paymentStatus === "paid" ? "Paid" : infoTarget.data.paymentStatus === "partially_paid" ? "Partial" : "Unpaid"}
                    </Badge>
                  </div>
                )}
                <div className="border-t pt-3 space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Players</div>
                  {infoTarget.data.players?.map((p: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <div className="font-medium">{p.name}</div>
                      <a href={`mailto:${p.email}`} className="text-sm text-primary hover:underline block">
                        {p.email}
                      </a>
                      {p.skillLevel && <Badge variant="secondary" className="text-xs">{p.skillLevel}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Team/Player Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedItem?.type === 'team' ? 'Team' : 'Player'} to Different Event</DialogTitle>
            <DialogDescription>
              Select the event you want to move this {selectedItem?.type === 'team' ? 'team' : 'player'} to. Both events must have the same format (singles/doubles).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedItem && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                {selectedItem.type === 'team' ? (
                  <>
                    <div className="font-semibold">{selectedItem.teamName}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedItem.players?.map((p: any) => p.name).join(' & ')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">{selectedItem.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedItem.email}</div>
                  </>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Event</label>
              <Select value={targetEventId} onValueChange={setTargetEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event..." />
                </SelectTrigger>
                <SelectContent>
                  {registrations
                    .filter((e: any) =>
                      e.eventId !== selectedItem?.currentEventId &&
                      e.format === registrations.find((r: any) => r.eventId === selectedItem?.currentEventId)?.format
                    )
                    .map((event: any) => (
                      <SelectItem key={event.eventId} value={event.eventId}>
                        {event.eventName} ({formatEventSkillLevel(event.skillLevel)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMoveDialogOpen(false);
                setSelectedItem(null);
                setTargetEventId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMove}
              disabled={!targetEventId || moveTeamMutation.isPending || movePlayerMutation.isPending}
            >
              {(moveTeamMutation.isPending || movePlayerMutation.isPending) ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                `Move ${selectedItem?.type === 'team' ? 'Team' : 'Player'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog
        open={isRefundDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRefundDialogOpen(false);
            setRefundTarget(null);
            setRefundReason("");
            setRefundConfirmStep("form");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CurrencyDollar className="w-5 h-5 text-destructive" />
              Issue Refund
            </DialogTitle>
            <DialogDescription>
              Process a full refund and remove this {refundTarget?.type === 'team' ? 'team' : 'player'} from the event.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {refundTarget && (
              <div className="p-3 bg-muted rounded-lg">
                {refundTarget.type === 'team' ? (
                  <>
                    <div className="font-semibold">{refundTarget.teamName}</div>
                    <div className="text-sm text-muted-foreground">
                      {refundTarget.players?.map((p: any) => p.name).join(' & ')}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">{refundTarget.name}</div>
                    <div className="text-sm text-muted-foreground">{refundTarget.email}</div>
                  </>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-display font-semibold text-sm">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Reason for issuing this refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            {refundConfirmStep === "confirm" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
                <Warning className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">
                  Are you sure? This will process a full refund via Stripe and remove the {refundTarget?.type === 'team' ? 'team' : 'player'} from the event. This action cannot be undone.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (refundConfirmStep === "confirm") {
                  setRefundConfirmStep("form");
                } else {
                  setIsRefundDialogOpen(false);
                  setRefundTarget(null);
                  setRefundReason("");
                  setRefundConfirmStep("form");
                }
              }}
              disabled={refundMutation.isPending}
            >
              {refundConfirmStep === "confirm" ? "Go Back" : "Cancel"}
            </Button>
            <Button
              variant={refundConfirmStep === "confirm" ? "destructive" : "default"}
              onClick={handleConfirmRefund}
              disabled={!refundReason.trim() || refundMutation.isPending}
            >
              {refundMutation.isPending ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : refundConfirmStep === "confirm" ? (
                "Confirm Refund"
              ) : (
                "Issue Refund"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredPlayers;
