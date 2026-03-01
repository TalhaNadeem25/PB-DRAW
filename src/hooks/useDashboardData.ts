import api, { authAPI, invitationAPI, teamAPI, tournamentAPI } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

export function useDashboardData(user: { _id: string; role?: string; skillLevel?: number; location?: { city?: string }; statistics?: any } | null) {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => authAPI.getStats(),
    enabled: !!user,
  });

  const { data: allTournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["all-tournaments-dashboard"],
    queryFn: () => tournamentAPI.getAll({ limit: 500 }),
  });

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ["my-teams"],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!user,
  });

  const { data: invitationsData, isLoading: invitationsLoading } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => invitationAPI.getReceived(),
    enabled: !!user,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["my-tickets-dashboard"],
    queryFn: async () => {
      const response = await api.get("/check-in/my-tickets");
      return response.data?.data ?? response.data;
    },
    enabled: !!user,
  });

  const { data: waitlistData, isLoading: waitlistLoading } = useQuery({
    queryKey: ["my-waitlist"],
    queryFn: async () => {
      try {
        const response = await api.get("/waitlist/my-entries");
        return response.data?.data ?? response.data ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  const dashboardLoading =
    statsLoading ||
    tournamentsLoading ||
    teamsLoading ||
    invitationsLoading ||
    ticketsLoading ||
    waitlistLoading;

  const stats =
    statsData?.data?.statistics ||
    user?.statistics || {
      matchesPlayed: 0,
      matchesWon: 0,
      tournamentsPlayed: 0,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
    };

  const winRate =
    stats.matchesPlayed > 0
      ? ((stats.matchesWon / stats.matchesPlayed) * 100).toFixed(1)
      : "0";

  const allTournaments = allTournamentsData?.data || [];
  const myTeams = teamsData?.data || [];
  const pendingInvitations = (invitationsData?.data || []).filter(
    (inv: { status: string }) => inv.status === "pending"
  );

  const myTournaments = allTournaments.filter(
    (t: { organizer?: { _id?: string } }) =>
      t.organizer?._id === user?._id || (t as any).organizer === user?._id
  );

  const upcomingTournaments =
    statsData?.data?.tournaments?.filter(
      (t: { status: string }) =>
        t.status === "open" || t.status === "upcoming" || t.status === "in-progress"
    ) || [];

  const myEventRegistrations = myTeams
    .filter((team: any) => team.event && team.event.tournament)
    .map((team: any) => ({
      eventId: team.event._id,
      eventName: team.event.name,
      eventFormat: team.event.format,
      tournamentId: team.event.tournament._id || team.event.tournament,
      tournamentName: team.event.tournament.name || "Tournament",
      tournamentStartDate: team.event.tournament.startDate,
      tournamentLocation: team.event.tournament.location || "TBD",
      tournamentStatus: team.event.tournament.status || "upcoming",
      teamId: team._id,
      teamName: team.name,
      isDoubles: team.players?.length > 1,
      partnerName: team.players?.find((p: any) => p._id !== user?._id)?.name,
      registeredAt: team.createdAt,
    }))
    .filter((reg: any) => {
      const status = reg.tournamentStatus;
      return (
        status === "open" ||
        status === "upcoming" ||
        status === "in-progress" ||
        status === "draft"
      );
    })
    .sort((a: any, b: any) => {
      const dateA = a.tournamentStartDate
        ? new Date(a.tournamentStartDate).getTime()
        : 0;
      const dateB = b.tournamentStartDate
        ? new Date(b.tournamentStartDate).getTime()
        : 0;
      return dateA - dateB;
    });

  const liveMatchesCount = myEventRegistrations.filter(
    (reg: any) => reg.tournamentStatus === "in-progress"
  ).length;

  const activeTournaments = myTournaments.filter(
    (t: { status: string }) => t.status === "open" || t.status === "in-progress"
  );

  const recommendedTournaments = allTournaments
    .filter((t: any) => {
      if (t.status !== "open") return false;
      const alreadyRegistered = upcomingTournaments.some(
        (ut: any) => ut._id === t._id
      );
      if (alreadyRegistered) return false;
      if (t.skillLevelRequirement?.min && user?.skillLevel) {
        if (
          user.skillLevel < t.skillLevelRequirement.min ||
          user.skillLevel > (t.skillLevelRequirement.max || 5.0)
        ) {
          return false;
        }
      }
      if (user?.location?.city && t.location) {
        return t.location
          .toLowerCase()
          .includes(user.location!.city!.toLowerCase());
      }
      return true;
    })
    .slice(0, 3);

  return {
    dashboardLoading,
    stats,
    winRate,
    allTournaments,
    myTeams,
    pendingInvitations,
    myTournaments,
    activeTournaments,
    myEventRegistrations,
    liveMatchesCount,
    recommendedTournaments,
    ticketsData: ticketsData ?? [],
    waitlistData: waitlistData ?? [],
    tournamentsLoading,
    teamsLoading,
    ticketsLoading,
  };
}
