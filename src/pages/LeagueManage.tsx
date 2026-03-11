import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { leagueAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  CaretLeft,
  Users,
  Trophy,
  CalendarBlank,
  Gear,
  Plus,
  FloppyDisk,
  Trash,
  Check,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TABS = ["Players", "Standings", "Sessions", "Settings"];

const SKILL_LEVELS = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

const SESSION_STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary border border-primary/30",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
};

export default function LeagueManage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Players");

  // Session dialog
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");

  // Standings editing
  const [editedStandings, setEditedStandings] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["league", id],
    queryFn: () => leagueAPI.getById(id!),
    enabled: !!id,
  });

  const league = data?.data;

  // Redirect if not organizer
  const isOrganizer =
    league &&
    (league.organizer?._id?.toString() === user?._id?.toString() ||
      user?.role === "admin");

  // Settings form
  const [settingsForm, setSettingsForm] = useState<any | null>(null);

  // Initialize settings form when league loads
  if (league && !settingsForm) {
    setSettingsForm({
      name: league.name ?? "",
      description: league.description ?? "",
      location: league.location ?? "",
      address: league.address ?? "",
      startDate: league.startDate ? league.startDate.substring(0, 10) : "",
      endDate: league.endDate ? league.endDate.substring(0, 10) : "",
      registrationDeadline: league.registrationDeadline
        ? league.registrationDeadline.substring(0, 10)
        : "",
      maxPlayers: league.maxPlayers ?? 32,
      entryFee: league.entryFee ?? 0,
      contactEmail: league.contactEmail ?? "",
      contactPhone: league.contactPhone ?? "",
      rules: league.rules ?? "",
      skillLevelMin: league.skillLevel?.min ?? 2.5,
      skillLevelMax: league.skillLevel?.max ?? 5.0,
      allowWaitlist: league.settings?.allowWaitlist ?? false,
      status: league.status ?? "open",
    });
  }

  // Remove player
  const removePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      // We do this by calling unregister on behalf — since there's no admin remove endpoint,
      // we update the league directly
      const currentPlayers = league.players.filter(
        (p: any) => (p.player?._id ?? p.player).toString() !== playerId
      );
      return leagueAPI.update(id!, { players: currentPlayers.map((p: any) => ({ player: p.player?._id ?? p.player, joinedAt: p.joinedAt, paymentStatus: p.paymentStatus })) });
    },
    onSuccess: () => {
      toast({ title: "Player removed" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to remove player.",
        variant: "destructive",
      });
    },
  });

  // Save standings
  const saveStandingsMutation = useMutation({
    mutationFn: () => {
      const standings = (league?.players ?? []).map((entry: any, idx: number) => {
        const pid = entry.player?._id ?? entry.player;
        const edited = editedStandings[pid] ?? {};
        return {
          playerId: pid,
          wins: Number(edited.wins ?? 0),
          losses: Number(edited.losses ?? 0),
          points: Number(edited.points ?? 0),
          gamesPlayed: Number(edited.gamesPlayed ?? 0),
          rank: 0,
        };
      });
      // Auto-rank by points desc
      standings.sort((a: any, b: any) => b.points - a.points);
      standings.forEach((s: any, i: number) => { s.rank = i + 1; });
      return leagueAPI.updateStandings(id!, standings);
    },
    onSuccess: () => {
      toast({ title: "Standings saved!" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to save standings.",
        variant: "destructive",
      });
    },
  });

  // Add session
  const addSessionMutation = useMutation({
    mutationFn: () => leagueAPI.addSession(id!, { date: sessionDate, notes: sessionNotes }),
    onSuccess: () => {
      toast({ title: "Session added!" });
      setSessionDialogOpen(false);
      setSessionDate("");
      setSessionNotes("");
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to add session.",
        variant: "destructive",
      });
    },
  });

  // Update session status
  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      leagueAPI.updateSession(id!, sessionId, { status }),
    onSuccess: () => {
      toast({ title: "Session updated" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to update session.",
        variant: "destructive",
      });
    },
  });

  // Save settings
  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      leagueAPI.update(id!, {
        ...settingsForm,
        maxPlayers: Number(settingsForm.maxPlayers),
        entryFee: Number(settingsForm.entryFee),
        skillLevel: {
          min: Number(settingsForm.skillLevelMin),
          max: Number(settingsForm.skillLevelMax),
        },
        settings: {
          allowWaitlist: settingsForm.allowWaitlist,
          isPublic: true,
        },
      }),
    onSuccess: () => {
      toast({ title: "Settings saved!" });
      queryClient.invalidateQueries({ queryKey: ["league", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 rounded bg-muted/50 w-1/3" />
          <div className="h-40 rounded-2xl bg-muted/50" />
        </div>
      </Layout>
    );
  }

  if (!league || !isOrganizer) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-black text-2xl uppercase">Not authorized</h2>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/leagues">Back to Leagues</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const getExistingStanding = (playerId: string) => {
    return league.standings?.find(
      (s: any) => (s.player?._id ?? s.player)?.toString() === playerId
    );
  };

  const getStandingValue = (playerId: string, field: string) => {
    if (editedStandings[playerId]?.[field] !== undefined) {
      return editedStandings[playerId][field];
    }
    const existing = getExistingStanding(playerId);
    return existing?.[field] ?? 0;
  };

  const setStandingValue = (playerId: string, field: string, value: any) => {
    setEditedStandings((prev) => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), [field]: value },
    }));
  };

  return (
    <Layout>
      {/* Header */}
      <section className="relative bg-hero-gradient overflow-hidden py-8 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            to={`/leagues/${id}`}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3 transition-colors"
          >
            <CaretLeft className="w-4 h-4" />
            Back to League
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Gear className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-tight">
                Manage League
              </h1>
              <p className="text-white/70 text-sm">{league.name}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[4.5rem] z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {TABS.map((tab) => {
              const icons: Record<string, any> = {
                Players: Users,
                Standings: Trophy,
                Sessions: CalendarBlank,
                Settings: Gear,
              };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-display font-bold uppercase tracking-wide rounded-xl transition-all duration-200",
                    activeTab === tab
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Players Tab */}
        {activeTab === "Players" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground">
                Registered Players ({league.players?.length ?? 0})
              </h3>
            </div>
            {!league.players || league.players.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold uppercase tracking-wide text-sm">No players yet</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        {["Player", "Email", "Skill", "Joined", "Payment", ""].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground text-left last:text-right"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {league.players.map((entry: any, i: number) => {
                        const p = entry.player;
                        const pid = p?._id ?? p;
                        return (
                          <tr
                            key={entry._id ?? i}
                            className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0">
                                  <span className="text-xs font-display font-black text-white">
                                    {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground">{p?.name ?? "Unknown"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{p?.email ?? "—"}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{p?.skillLevel ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {entry.joinedAt ? format(new Date(entry.joinedAt), "MMM d, yyyy") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                  entry.paymentStatus === "paid"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                )}
                              >
                                {entry.paymentStatus ?? "unpaid"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePlayerMutation.mutate(pid?.toString())}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 px-2"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Standings Tab */}
        {activeTab === "Standings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground">
                Edit Standings
              </h3>
              <Button
                onClick={() => saveStandingsMutation.mutate()}
                disabled={saveStandingsMutation.isPending}
                className="font-display font-bold uppercase tracking-wide text-xs gap-2"
              >
                <FloppyDisk className="w-4 h-4" />
                {saveStandingsMutation.isPending ? "Saving..." : "Save Standings"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter wins, losses, and points for each player. Ranks are auto-calculated by points.
            </p>
            {!league.players || league.players.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold uppercase tracking-wide text-sm">No players to rank</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        {["Player", "Wins", "Losses", "Points", "Games Played"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-display font-bold text-xs uppercase tracking-wide text-muted-foreground text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {league.players.map((entry: any, i: number) => {
                        const p = entry.player;
                        const pid = (p?._id ?? p)?.toString();
                        return (
                          <tr
                            key={entry._id ?? i}
                            className="border-b border-border/30 last:border-0"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0">
                                  <span className="text-xs font-display font-black text-white">
                                    {p?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <span className="font-medium text-foreground">{p?.name ?? "Unknown"}</span>
                              </div>
                            </td>
                            {["wins", "losses", "points", "gamesPlayed"].map((field) => (
                              <td key={field} className="px-4 py-2">
                                <Input
                                  type="number"
                                  min={0}
                                  value={getStandingValue(pid, field)}
                                  onChange={(e) => setStandingValue(pid, field, e.target.value)}
                                  className="w-20 h-8 rounded-lg text-sm"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sessions Tab */}
        {activeTab === "Sessions" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground">
                Sessions ({league.sessions?.length ?? 0})
              </h3>
              <Button
                onClick={() => setSessionDialogOpen(true)}
                className="font-display font-bold uppercase tracking-wide text-xs gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </Button>
            </div>

            {!league.sessions || league.sessions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarBlank className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-display font-bold uppercase tracking-wide text-sm">No sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {league.sessions.map((session: any, i: number) => (
                  <div
                    key={session._id ?? i}
                    className="glass-card rounded-xl p-4 border border-border/50 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm">
                      <span className="font-display font-black text-sm text-white">
                        {session.sessionNumber ?? i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
                          Session {session.sessionNumber ?? i + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                            SESSION_STATUS_COLORS[session.status] ?? SESSION_STATUS_COLORS.upcoming
                          )}
                        >
                          {session.status}
                        </span>
                      </div>
                      {session.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(session.date), "EEEE, MMM d, yyyy")}
                        </p>
                      )}
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {session.status === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateSessionMutation.mutate({
                              sessionId: session._id,
                              status: "active",
                            })
                          }
                          className="h-8 text-xs font-display font-bold uppercase tracking-wide border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          Mark Active
                        </Button>
                      )}
                      {session.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateSessionMutation.mutate({
                              sessionId: session._id,
                              status: "completed",
                            })
                          }
                          className="h-8 text-xs font-display font-bold uppercase tracking-wide border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Session Dialog */}
            <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
              <DialogContent className="glass-card border border-border/50 rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display font-black text-lg uppercase tracking-tight">
                    Add Session
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                      Notes
                    </Label>
                    <Textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Optional notes for this session..."
                      rows={3}
                      className="rounded-xl resize-none"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSessionDialogOpen(false)}
                    className="font-display font-bold uppercase tracking-wide text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addSessionMutation.mutate()}
                    disabled={addSessionMutation.isPending || !sessionDate}
                    className="font-display font-bold uppercase tracking-wide text-xs rounded-xl"
                  >
                    {addSessionMutation.isPending ? "Adding..." : "Add Session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === "Settings" && settingsForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-foreground">
                League Settings
              </h3>
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="font-display font-bold uppercase tracking-wide text-xs gap-2"
              >
                <FloppyDisk className="w-4 h-4" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    League Name
                  </Label>
                  <Input
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Description
                  </Label>
                  <Textarea
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Location
                  </Label>
                  <Input
                    value={settingsForm.location}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, location: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Address
                  </Label>
                  <Input
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, address: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={settingsForm.startDate}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, startDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={settingsForm.endDate}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, endDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Registration Deadline
                  </Label>
                  <Input
                    type="date"
                    value={settingsForm.registrationDeadline}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, registrationDeadline: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Max Players
                  </Label>
                  <Input
                    type="number"
                    min={4}
                    value={settingsForm.maxPlayers}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, maxPlayers: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Entry Fee ($)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={settingsForm.entryFee}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, entryFee: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Contact Email
                  </Label>
                  <Input
                    type="email"
                    value={settingsForm.contactEmail}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, contactEmail: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Contact Phone
                  </Label>
                  <Input
                    value={settingsForm.contactPhone}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, contactPhone: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Skill Level Min
                  </Label>
                  <select
                    value={settingsForm.skillLevelMin}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, skillLevelMin: Number(e.target.value) }))}
                    className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Skill Level Max
                  </Label>
                  <select
                    value={settingsForm.skillLevelMax}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, skillLevelMax: Number(e.target.value) }))}
                    className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                    Status
                  </Label>
                  <select
                    value={settingsForm.status}
                    onChange={(e) => setSettingsForm((f: any) => ({ ...f, status: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {["draft", "open", "active", "completed"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40">
                <div>
                  <p className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
                    Allow Waitlist
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Players can join a waitlist when the league is full
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsForm((f: any) => ({ ...f, allowWaitlist: !f.allowWaitlist }))}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    settingsForm.allowWaitlist ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                      settingsForm.allowWaitlist ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div>
                <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                  Rules
                </Label>
                <Textarea
                  value={settingsForm.rules}
                  onChange={(e) => setSettingsForm((f: any) => ({ ...f, rules: e.target.value }))}
                  rows={4}
                  className="rounded-xl resize-none"
                  placeholder="League rules..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
