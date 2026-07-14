import { useQuery } from "@tanstack/react-query";
import { eventAPI } from "@/services/api";
import { CircleNotch, Users, Star } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { formatEventSkillLevel } from "@/types/tournament";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PublicRegisteredPlayersProps {
  eventIds: string[];
}

// Read-only registered players/teams list for non-organizer viewers.
// Sources data from GET /api/events/:id, which is genuinely public (no auth
// check), unlike the organizer-only /tournaments/:id/registrations endpoint —
// so this never 403s for regular players viewing a tournament.
const PublicRegisteredPlayers = ({ eventIds }: PublicRegisteredPlayersProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-registered-players", eventIds],
    queryFn: async () => {
      const responses = await Promise.all(eventIds.map((id) => eventAPI.getById(id)));
      return responses.map((res) => res.data);
    },
    enabled: eventIds.length > 0,
  });

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
        <p>Failed to load players. Please try again.</p>
      </div>
    );
  }

  const events = data || [];
  const eventsWithRegistrations = events.filter((event: any) => {
    const count = event.format === "singles"
      ? (event.registeredPlayers || []).filter((r: any) => r.paymentStatus === "paid").length
      : (event.teams || []).filter((t: any) => t.paymentStatus !== "unpaid").length;
    return count > 0;
  });

  if (eventsWithRegistrations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No players have registered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {eventsWithRegistrations.map((event: any) => {
        const isSingles = event.format === "singles";
        const players = isSingles
          ? (event.registeredPlayers || []).filter((r: any) => r.paymentStatus === "paid")
          : [];
        const teams = isSingles
          ? []
          : (event.teams || []).filter((t: any) => t.paymentStatus !== "unpaid");
        const total = isSingles ? players.length : teams.length;

        return (
          <div key={event._id} className="border border-pb-hairline rounded-[6px] overflow-hidden">
            <div className="bg-pb-court p-4 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-white">{event.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="capitalize border-white/30 text-white">
                    {event.format.replace("-", " ")}
                  </Badge>
                  <Badge variant="outline" className="border-white/30 text-white">
                    {formatEventSkillLevel(event.skillLevel)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-display font-bold text-white">{total}</div>
                <div className="text-sm text-white/80">{isSingles ? "Players" : "Teams"}</div>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto">
              {isSingles ? (
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Skill Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((reg: any, idx: number) => (
                      <TableRow key={reg.player?._id || idx} className={cn(idx % 2 === 0 && "bg-muted/30")}>
                        <TableCell className="font-semibold">{reg.player?.name || "Player"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <Star className="w-3 h-3" />
                            {reg.player?.skillLevel || "N/A"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Players</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team: any, idx: number) => (
                      <TableRow key={team._id} className={cn(idx % 2 === 0 && "bg-muted/30")}>
                        <TableCell className="font-semibold">{team.name}</TableCell>
                        <TableCell>
                          {(team.players || []).map((p: any) => p.name).filter(Boolean).join(" & ") || "—"}
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

export default PublicRegisteredPlayers;
