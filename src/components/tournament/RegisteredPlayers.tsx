import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentAPI, teamAPI } from "@/services/api";
import { Loader2, Users, Mail, Star, Calendar, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
import { cn } from "@/lib/utils";

interface RegisteredPlayersProps {
  tournamentId: string;
}

const RegisteredPlayers = ({ tournamentId }: RegisteredPlayersProps) => {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [targetEventId, setTargetEventId] = useState<string>("");
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

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
      setSelectedTeam(null);
      setTargetEventId("");
      toast.success(data.message || "Team moved successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to move team");
    },
  });

  const handleMoveClick = (team: any, currentEventId: string) => {
    setSelectedTeam({ ...team, currentEventId });
    setIsMoveDialogOpen(true);
  };

  const handleConfirmMove = () => {
    if (!targetEventId || !selectedTeam) {
      toast.error("Please select a target event");
      return;
    }

    moveTeamMutation.mutate({
      teamId: selectedTeam.teamId,
      targetEventId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                      {event.skillLevel}+
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

            <div className="p-6">
              {event.format === 'singles' ? (
                // Singles Format - Show individual players
                <Table>
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
                        <TableCell className="font-semibold">{player.name}</TableCell>
                        <TableCell>
                          <a href={`mailto:${player.email}`} className="text-primary hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />
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
                              <CheckCircle2 className="w-3 h-3" />
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
                          <span className="text-xs text-muted-foreground italic">Singles - Use Teams Tab</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                // Doubles/Mixed Format - Show teams with partners
                <Table>
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
                        <TableCell className="font-semibold">{team.teamName}</TableCell>
                        <TableCell>
                          {team.players[0] ? (
                            <div>
                              <div className="font-medium">{team.players[0].name}</div>
                              <a href={`mailto:${team.players[0].email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" />
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
                              <div className="font-medium">{team.players[1].name}</div>
                              <a href={`mailto:${team.players[1].email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" />
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
                              <CheckCircle2 className="w-3 h-3" />
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveClick(team, event.eventId)}
                            className="flex items-center gap-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            Move
                          </Button>
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

      {/* Move Team Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Team to Different Event</DialogTitle>
            <DialogDescription>
              Select the event you want to move this team to. Both events must have the same format (singles/doubles).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTeam && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="font-semibold">{selectedTeam.teamName}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedTeam.players?.map((p: any) => p.name).join(' & ')}
                </div>
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
                      e.eventId !== selectedTeam?.currentEventId &&
                      e.format === registrations.find((r: any) => r.eventId === selectedTeam?.currentEventId)?.format
                    )
                    .map((event: any) => (
                      <SelectItem key={event.eventId} value={event.eventId}>
                        {event.eventName} ({event.skillLevel}+)
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
                setSelectedTeam(null);
                setTargetEventId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMove}
              disabled={!targetEventId || moveTeamMutation.isPending}
            >
              {moveTeamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                "Move Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegisteredPlayers;
