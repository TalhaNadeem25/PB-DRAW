import { useQuery } from "@tanstack/react-query";
import { tournamentAPI } from "@/services/api";
import { Loader2, Users, Mail, Star, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface RegisteredPlayersProps {
  tournamentId: string;
}

const RegisteredPlayers = ({ tournamentId }: RegisteredPlayersProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tournament-registrations', tournamentId],
    queryFn: () => tournamentAPI.getRegistrations(tournamentId),
    enabled: !!tournamentId,
  });

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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RegisteredPlayers;
