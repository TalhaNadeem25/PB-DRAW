import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
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
import { clubAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Users,
  Gear,
  CaretLeft,
  CaretDown,
  CaretUp,
  CalendarPlus,
  ChatCircle,
  Clock,
  LockSimple,
  Plus,
  Trash,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const joinTypeLabel: Record<string, string> = {
  open: "Open",
  request: "Request to Join",
  "invite-only": "Invite Only",
};

const TABS = ["Overview", "Members", "Games", "Chat"];

const rosterToneClasses: Record<string, string> = {
  court: "bg-pb-court text-white",
  amber: "bg-pb-amber text-white",
  paper: "bg-pb-surface2 text-pb-muted border border-pb-hairline",
};

function RosterColumn({
  label,
  entries,
  tone,
}: {
  label: string;
  entries: any[];
  tone: "court" | "amber" | "paper";
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-muted mb-2">
        {label} ({entries.length})
      </p>
      {entries.length === 0 ? (
        <p className="font-mono text-[11px] text-pb-faint">No one yet</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map((r: any, i: number) => (
            <div key={r._id ?? i} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                  rosterToneClasses[tone]
                )}
              >
                <span className="font-mono text-[8px] font-bold">
                  {r.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </span>
              </div>
              <span className="font-mono text-[12px] text-pb-ink truncate">
                {r.user?.name ?? "Player"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({
  game,
  clubId,
  currentUserId,
}: {
  game: any;
  clubId: string;
  currentUserId?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showRoster, setShowRoster] = useState(false);

  const myRsvp = game.rsvps?.find(
    (r: any) => (r.user?._id ?? r.user) === currentUserId
  );
  const goingRsvps = game.rsvps?.filter((r: any) => r.status === "going") ?? [];
  const maybeRsvps = game.rsvps?.filter((r: any) => r.status === "maybe") ?? [];
  const notGoingRsvps = game.rsvps?.filter((r: any) => r.status === "not-going") ?? [];
  const goingCount = goingRsvps.length;
  const maybeCount = maybeRsvps.length;
  const totalResponses = goingCount + maybeCount + notGoingRsvps.length;
  const isCreator = (game.createdBy?._id ?? game.createdBy) === currentUserId;
  const isCancelled = game.status === "cancelled";

  const spotsLeft = Math.max(0, (game.maxPlayers ?? 0) - goingCount);
  const isFull = spotsLeft === 0;
  const isFillingFast = !isFull && spotsLeft <= 2;
  const fillPercent = game.maxPlayers ? Math.min(100, (goingCount / game.maxPlayers) * 100) : 0;

  const VISIBLE_AVATARS = 6;
  const visibleGoing = goingRsvps.slice(0, VISIBLE_AVATARS);
  const overflowGoing = Math.max(0, goingCount - VISIBLE_AVATARS);

  const rsvpMutation = useMutation({
    mutationFn: (status: "going" | "maybe" | "not-going") => clubAPI.rsvp(clubId, game._id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-games", clubId] }),
    onError: (err: any) => {
      toast({
        title: "Couldn't RSVP",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => clubAPI.cancelGame(clubId, game._id),
    onSuccess: () => {
      toast({ title: "Game cancelled" });
      queryClient.invalidateQueries({ queryKey: ["club-games", clubId] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't cancel game",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div
      className={cn(
        "bg-pb-surface border border-pb-hairline rounded-[8px] p-4",
        isCancelled && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[13px] font-bold text-pb-ink flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-pb-muted" />
            {game.date ? format(new Date(game.date), "EEE, MMM d · h:mm a") : "—"}
            {game.endTime && ` – ${format(new Date(game.endTime), "h:mm a")}`}
          </p>
          {game.location && (
            <p className="font-mono text-[12px] text-pb-muted mt-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {game.location}
            </p>
          )}
          {game.notes && <p className="font-mono text-[12px] text-pb-muted mt-1">{game.notes}</p>}
        </div>
        {isCancelled ? (
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] bg-red-500/10 text-red-600 border border-red-500/30">
            Cancelled
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px]",
              isFull
                ? "bg-pb-surface2 text-pb-muted border border-pb-hairline"
                : isFillingFast
                ? "bg-red-500/10 text-red-600 border border-red-500/30"
                : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
            )}
          >
            {isFull ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
          </span>
        )}
      </div>

      {/* Capacity bar */}
      {!isCancelled && (
        <div className="mt-3">
          <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isFull ? "bg-pb-court" : isFillingFast ? "bg-red-500" : "bg-pb-court"
              )}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Who's in */}
      {!isCancelled && (goingCount > 0 || maybeCount > 0) && (
        <div className="mt-3 space-y-1.5">
          {goingCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {visibleGoing.map((r: any, i: number) => (
                  <div
                    key={r._id ?? i}
                    title={r.user?.name ?? "Player"}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 border-pb-surface flex items-center justify-center shrink-0",
                      i > 0 && "-ml-2"
                    )}
                    style={{ zIndex: visibleGoing.length - i }}
                  >
                    <div className="w-full h-full rounded-full bg-pb-court text-white flex items-center justify-center">
                      <span className="font-mono text-[9px] font-bold">
                        {r.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  </div>
                ))}
                {overflowGoing > 0 && (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-pb-surface bg-pb-surface2 flex items-center justify-center shrink-0 -ml-2"
                    style={{ zIndex: 0 }}
                  >
                    <span className="font-mono text-[9px] font-bold text-pb-muted">
                      +{overflowGoing}
                    </span>
                  </div>
                )}
              </div>
              <p className="font-mono text-[11px] text-pb-muted truncate">
                {goingRsvps
                  .slice(0, 3)
                  .map((r: any) => r.user?.name?.split(" ")[0] ?? "Player")
                  .join(", ")}
                {goingCount > 3 ? ` +${goingCount - 3} more going` : " going"}
              </p>
            </div>
          )}
          {maybeCount > 0 && (
            <p className="font-mono text-[11px] text-pb-muted">
              <span className="text-pb-ink">{maybeCount}</span> maybe:{" "}
              {maybeRsvps
                .slice(0, 3)
                .map((r: any) => r.user?.name?.split(" ")[0] ?? "Player")
                .join(", ")}
              {maybeCount > 3 ? ` +${maybeCount - 3} more` : ""}
            </p>
          )}
        </div>
      )}

      {!isCancelled && totalResponses > 0 && (
        <button
          onClick={() => setShowRoster((v) => !v)}
          className="mt-2 font-mono text-[11px] text-pb-court hover:underline flex items-center gap-1"
        >
          {showRoster ? <CaretUp className="w-3 h-3" /> : <CaretDown className="w-3 h-3" />}
          {showRoster ? "Hide roster" : `View full roster (${totalResponses})`}
        </button>
      )}

      {!isCancelled && showRoster && (
        <div className="mt-3 grid sm:grid-cols-3 gap-4 pt-3 border-t border-pb-hairline">
          <RosterColumn label="Going" entries={goingRsvps} tone="court" />
          <RosterColumn label="Maybe" entries={maybeRsvps} tone="amber" />
          <RosterColumn label="Can't Make It" entries={notGoingRsvps} tone="paper" />
        </div>
      )}

      {!isCancelled && currentUserId && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-pb-hairline">
          {(["going", "maybe", "not-going"] as const).map((status) => (
            <button
              key={status}
              onClick={() => rsvpMutation.mutate(status)}
              disabled={rsvpMutation.isPending}
              className={cn(
                "font-mono text-[11px] uppercase tracking-[0.06em] px-3 py-1.5 rounded-[6px] border transition-colors disabled:opacity-50",
                myRsvp?.status === status
                  ? "bg-pb-court text-white border-pb-court"
                  : "border-pb-hairline text-pb-ink hover:bg-pb-surface2"
              )}
            >
              {status === "going" ? "Going" : status === "maybe" ? "Maybe" : "Can't make it"}
            </button>
          ))}
          {isCreator && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="sm:ml-auto font-mono text-[11px] text-red-600 hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "games" ? "Games" : "Overview"
  );
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [gameForm, setGameForm] = useState({
    location: "",
    maxPlayers: 8,
    notes: "",
  });
  const emptyDateRow = { date: "", startTime: "18:00", endTime: "20:00" };
  const [dateRows, setDateRows] = useState([{ ...emptyDateRow }]);

  const updateDateRow = (index: number, field: "date" | "startTime" | "endTime", value: string) => {
    setDateRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };
  const addDateRow = () => setDateRows((rows) => [...rows, { ...emptyDateRow }]);
  const removeDateRow = (index: number) =>
    setDateRows((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));

  const { data, isLoading, error } = useQuery({
    queryKey: ["club", id],
    queryFn: () => clubAPI.getById(id!),
    enabled: !!id,
  });

  const club = data?.data;

  const { data: gamesData } = useQuery({
    queryKey: ["club-games", id],
    queryFn: () => clubAPI.getGames(id!),
    enabled: !!id && isAuthenticated,
  });
  const games = gamesData?.data ?? [];

  const membership = isAuthenticated
    ? club?.members?.find((m: any) => (m.user?._id ?? m.user) === user?._id)
    : null;
  const isAdmin = membership?.status === "active" && membership?.role === "admin";
  const isMember = membership?.status === "active";
  const isPending = membership?.status === "pending";

  const { data: announcementsData } = useQuery({
    queryKey: ["club-announcements", id],
    queryFn: () => clubAPI.getAnnouncements(id!),
    enabled: !!id && isMember,
  });
  const announcements = announcementsData?.data ?? [];

  const { socket, joinClub, leaveClub } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: messagesData } = useQuery({
    queryKey: ["club-messages", id],
    queryFn: () => clubAPI.getMessages(id!),
    enabled: !!id && isMember,
  });

  useEffect(() => {
    if (messagesData?.data) setMessages(messagesData.data);
  }, [messagesData]);

  useEffect(() => {
    if (!id || !isMember) return;
    joinClub(id);
    return () => leaveClub(id);
  }, [id, isMember, joinClub, leaveClub]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg: any) => {
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };
    const onDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };
    socket.on("club-message", onMessage);
    socket.on("club-message-deleted", onDeleted);
    return () => {
      socket.off("club-message", onMessage);
      socket.off("club-message-deleted", onDeleted);
    };
  }, [socket]);

  useEffect(() => {
    if (activeTab === "Chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => clubAPI.sendMessage(id!, text),
    onSuccess: (res) => {
      setMessageInput("");
      setMessages((prev) => (prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]));
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't send message",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => clubAPI.deleteMessage(id!, messageId),
    onSuccess: (_data, messageId) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: () => clubAPI.join(id!),
    onSuccess: (res) => {
      toast({ title: res.message || "Success" });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't join club",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => clubAPI.leave(id!),
    onSuccess: () => {
      toast({ title: "Left club" });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't leave club",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const createGameMutation = useMutation({
    mutationFn: () => {
      const rows = dateRows.filter((r) => r.date);
      const games = rows.map((r) => ({
        date: new Date(`${r.date}T${r.startTime}`).toISOString(),
        endTime: new Date(`${r.date}T${r.endTime}`).toISOString(),
        location: gameForm.location || club?.location,
        maxPlayers: Number(gameForm.maxPlayers),
        notes: gameForm.notes,
      }));
      return clubAPI.createGamesBatch(id!, games);
    },
    onSuccess: (res) => {
      const count = res.data?.length ?? 1;
      toast({ title: count > 1 ? `${count} games scheduled` : "Game scheduled" });
      setGameDialogOpen(false);
      setGameForm({ location: "", maxPlayers: 8, notes: "" });
      setDateRows([{ ...emptyDateRow }]);
      queryClient.invalidateQueries({ queryKey: ["club-games", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't create game",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const setTab = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === "Games" ? { tab: "games" } : {});
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-4 rounded bg-pb-surface2 w-24" />
          <div className="h-10 rounded bg-pb-surface2 w-1/2" />
          <div className="h-4 rounded bg-pb-surface2 w-2/3" />
        </div>
      </Layout>
    );
  }

  if (error || !club) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
            Club not found
          </h2>
          <Link
            to="/clubs"
            className="mt-4 inline-flex items-center gap-1.5 border border-pb-hairline rounded-[6px] font-mono text-[12px] text-pb-ink px-4 h-9 hover:bg-pb-surface2 transition-colors"
          >
            <CaretLeft className="w-4 h-4" />
            Back to Clubs
          </Link>
        </div>
      </Layout>
    );
  }

  const activeMembers = club.members?.filter((m: any) => m.status === "active") ?? [];
  const upcomingGames = games.filter((g: any) => g.status !== "completed");

  return (
    <Layout>
      <div className="bg-pb-paper border-b border-pb-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-1 font-mono text-[12px] text-pb-muted hover:text-pb-ink transition-colors mb-5"
          >
            <CaretLeft className="w-3.5 h-3.5" />
            All Clubs
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] bg-pb-surface2 text-pb-muted border border-pb-hairline">
                  {joinTypeLabel[club.joinType] ?? club.joinType}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-[40px] tracking-[-0.04em] leading-tight text-pb-ink mb-3">
                {club.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {club.location && (
                  <span className="font-mono text-[13px] text-pb-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {club.location}
                  </span>
                )}
                <span className="font-mono text-[13px] text-pb-muted flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  {activeMembers.length} member{activeMembers.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {isAdmin ? (
                <Link
                  to={`/clubs/${id}/manage`}
                  className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 hover:opacity-90 transition-opacity"
                >
                  <Gear className="w-4 h-4" />
                  Manage Club
                </Link>
              ) : isMember ? (
                <button
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                  className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink px-5 h-10 hover:bg-pb-surface2 transition-colors disabled:opacity-50"
                >
                  {leaveMutation.isPending ? "Leaving..." : "Leave Club"}
                </button>
              ) : isPending ? (
                <button
                  disabled
                  className="border border-pb-hairline text-pb-muted rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 cursor-not-allowed"
                >
                  Request Pending
                </button>
              ) : club.joinType === "invite-only" ? (
                <span className="font-mono text-[12px] text-pb-muted flex items-center gap-1.5">
                  <LockSimple className="w-3.5 h-3.5" />
                  Invite only — ask an admin to add you
                </span>
              ) : isAuthenticated ? (
                <button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {joinMutation.isPending
                    ? "..."
                    : club.joinType === "request"
                    ? "Request to Join"
                    : "Join Club"}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-5 h-10 flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  Sign In to Join
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-[4.5rem] z-30 bg-pb-paper border-b border-pb-hairline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setTab(tab)}
                className={cn(
                  "shrink-0 px-5 py-3.5 font-mono text-[13px] uppercase tracking-[0.06em] transition-all duration-200 border-b-2",
                  activeTab === tab
                    ? "border-pb-ink text-pb-ink"
                    : "border-transparent text-pb-muted hover:text-pb-ink"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 bg-pb-paper">
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {isMember && announcements.length > 0 && (
                <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-3">
                    Announcements
                  </p>
                  <div className="space-y-4">
                    {announcements.map((a: any) => (
                      <div
                        key={a._id}
                        className="pb-4 border-b border-pb-hairline last:border-0 last:pb-0"
                      >
                        <p className="text-[14px] text-pb-ink leading-relaxed whitespace-pre-wrap">
                          {a.message}
                        </p>
                        <p className="font-mono text-[11px] text-pb-muted mt-1.5">
                          {a.postedBy?.name ?? "Admin"} ·{" "}
                          {a.createdAt ? format(new Date(a.createdAt), "MMM d, h:mm a") : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {club.description && (
                <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-3">
                    About
                  </p>
                  <p className="text-[14px] text-pb-ink leading-relaxed">{club.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                  Details
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-pb-muted" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-pb-muted">
                      Location
                    </p>
                    <p className="font-mono text-[13px] text-pb-ink">{club.location}</p>
                  </div>
                </div>
                {club.address && (
                  <p className="font-mono text-[12px] text-pb-muted pl-10">{club.address}</p>
                )}
              </div>

              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                  Creator
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                    <span className="font-mono text-[13px] font-bold text-pb-ink">
                      {club.creator?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[13px] text-pb-ink">{club.creator?.name}</p>
                    <p className="font-mono text-[11px] text-pb-muted">{club.creator?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Members" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink">
                Members
              </h3>
              <span className="font-mono text-[12px] text-pb-muted">{activeMembers.length}</span>
            </div>
            {!isMember ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <Users className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                  Join this club to see its members
                </p>
              </div>
            ) : (
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm divide-y divide-pb-hairline">
                    <thead className="bg-pb-surface2">
                      <tr>
                        {["Member", "Role", "Joined"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted text-left"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pb-hairline">
                      {activeMembers.map((m: any) => (
                        <tr key={m._id} className="hover:bg-pb-surface2/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                                <span className="font-mono text-[11px] font-bold text-pb-ink">
                                  {m.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                </span>
                              </div>
                              <div>
                                <p className="font-mono text-[13px] text-pb-ink">{m.user?.name ?? "Unknown"}</p>
                                <p className="font-mono text-[11px] text-pb-muted">{m.user?.email ?? ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "font-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[4px]",
                                m.role === "admin"
                                  ? "bg-blue-500/15 text-blue-700 border border-blue-500/30"
                                  : "bg-pb-surface2 text-pb-muted border border-pb-hairline"
                              )}
                            >
                              {m.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-pb-muted">
                            {m.joinedAt ? format(new Date(m.joinedAt), "MMM d, yyyy") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Games" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink">
                Games
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setGameDialogOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] px-4 h-9 hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  New Game
                </button>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <CalendarPlus className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                  Sign in to see scheduled games
                </p>
              </div>
            ) : upcomingGames.length === 0 ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <CalendarPlus className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                  No games scheduled yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingGames.map((game: any) => (
                  <GameCard key={game._id} game={game} clubId={id!} currentUserId={user?._id} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Chat" && (
          <div>
            <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink mb-5">
              Chat
            </h3>
            {!isMember ? (
              <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                <ChatCircle className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                  Join this club to chat with members
                </p>
              </div>
            ) : (
              <div className="bg-pb-surface border border-pb-hairline rounded-[8px] flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <ChatCircle className="w-9 h-9 mb-3 text-pb-muted opacity-40" />
                      <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                        No messages yet — say hi
                      </p>
                    </div>
                  ) : (
                    messages.map((m: any) => {
                      const isMine = (m.user?._id ?? m.user) === user?._id;
                      const canDelete = isMine || isAdmin;
                      return (
                        <div key={m._id} className="group flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0 mt-0.5">
                            <span className="font-mono text-[11px] font-bold text-pb-ink">
                              {m.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono text-[12px] font-bold text-pb-ink">
                                {m.user?.name ?? "Player"}
                              </span>
                              <span className="font-mono text-[10px] text-pb-muted">
                                {m.createdAt ? format(new Date(m.createdAt), "h:mm a") : ""}
                              </span>
                              {canDelete && (
                                <button
                                  onClick={() => deleteMessageMutation.mutate(m._id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-red-600 hover:underline ml-auto"
                                >
                                  <Trash className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-[13px] text-pb-ink leading-snug whitespace-pre-wrap break-words">
                              {m.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (messageInput.trim()) sendMessageMutation.mutate(messageInput.trim());
                  }}
                  className="flex items-center gap-2 p-3 border-t border-pb-hairline"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Message the club..."
                    className="flex-1"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !messageInput.trim()}
                    className="shrink-0 w-9 h-9 rounded-[6px] bg-pb-court text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <PaperPlaneRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={gameDialogOpen} onOpenChange={setGameDialogOpen}>
        <DialogContent className="bg-pb-paper border border-pb-hairline rounded-[8px] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-[18px] tracking-[-0.02em] text-pb-ink">
              Schedule Games
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <Label className="font-mono text-[12px] text-pb-ink">Dates &amp; Times</Label>
              {dateRows.map((row, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_110px_110px] gap-2">
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateDateRow(i, "date", e.target.value)}
                    />
                    <Input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => updateDateRow(i, "startTime", e.target.value)}
                    />
                    <Input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => updateDateRow(i, "endTime", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDateRow(i)}
                    disabled={dateRows.length === 1}
                    className="shrink-0 w-9 h-9 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:text-red-600 hover:border-red-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDateRow}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-pb-court hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another date
              </button>
            </div>

            <div className="h-px bg-pb-hairline" />

            <div>
              <Label className="font-mono text-[12px] text-pb-ink">Location</Label>
              <Input
                value={gameForm.location}
                onChange={(e) => setGameForm((f) => ({ ...f, location: e.target.value }))}
                placeholder={club.location}
              />
            </div>
            <div>
              <Label className="font-mono text-[12px] text-pb-ink">Max Players</Label>
              <Input
                type="number"
                min={2}
                value={gameForm.maxPlayers}
                onChange={(e) => setGameForm((f) => ({ ...f, maxPlayers: Number(e.target.value) }))}
                className="max-w-[120px]"
              />
            </div>
            <div>
              <Label className="font-mono text-[12px] text-pb-ink">Notes (optional)</Label>
              <Textarea
                value={gameForm.notes}
                onChange={(e) => setGameForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="BYO paddles, courts 1-2, etc. (applies to all games above)"
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setGameDialogOpen(false)}
              className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-9 px-4 hover:bg-pb-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => createGameMutation.mutate()}
              disabled={createGameMutation.isPending || !dateRows.some((r) => r.date)}
              className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {createGameMutation.isPending
                ? "Scheduling..."
                : dateRows.filter((r) => r.date).length > 1
                ? `Schedule ${dateRows.filter((r) => r.date).length} Games`
                : "Schedule Game"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
