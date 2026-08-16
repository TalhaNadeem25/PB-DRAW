import { useState, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clubAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  SquaresFour,
  UserPlus,
  CalendarBlank,
  Trash,
  FloppyDisk,
  Check,
  X,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ClubSection = "overview" | "requests" | "members" | "games";

const fieldLabel = "font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-1.5 block";

const JOIN_TYPES = [
  { value: "open", label: "Open" },
  { value: "request", label: "Request to Join" },
  { value: "invite-only", label: "Invite Only" },
];

const sidebarItems = [
  { id: "overview" as ClubSection, label: "Overview", icon: SquaresFour },
  { id: "requests" as ClubSection, label: "Requests", icon: UserPlus },
  { id: "members" as ClubSection, label: "Members", icon: Users },
  { id: "games" as ClubSection, label: "Games", icon: CalendarBlank },
];

function ClubSidebar({
  activeSection,
  onSectionChange,
  requestCount,
}: {
  activeSection: ClubSection;
  onSectionChange: (s: ClubSection) => void;
  requestCount: number;
}) {
  return (
    <nav className="hidden lg:block w-56 shrink-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-pb-muted mb-1.5 px-3">
        Management
      </p>
      <div className="space-y-0.5">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] font-mono text-[13px] transition-colors",
                isActive
                  ? "bg-pb-surface2 text-pb-ink font-medium"
                  : "text-pb-muted hover:text-pb-ink hover:bg-pb-surface2/50"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "requests" && requestCount > 0 && (
                <span className="bg-pb-court text-white font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {requestCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MobileClubNav({
  activeSection,
  onSectionChange,
  requestCount,
}: {
  activeSection: ClubSection;
  onSectionChange: (s: ClubSection) => void;
  requestCount: number;
}) {
  return (
    <div className="lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 border-b border-pb-hairline mb-6 bg-pb-paper sticky top-14 z-20">
      <div className="flex gap-0 min-w-max">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3.5 font-mono text-[12px] uppercase tracking-[0.06em] whitespace-nowrap transition-all border-b-2",
                isActive
                  ? "border-pb-ink text-pb-ink"
                  : "border-transparent text-pb-muted hover:text-pb-ink"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.id === "requests" && requestCount > 0 && (
                <span className="bg-pb-court text-white font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {requestCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ClubManage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = (searchParams.get("tab") as ClubSection) || "overview";
  const setActiveSection = useCallback(
    (section: ClubSection) => setSearchParams({ tab: section }, { replace: true }),
    [setSearchParams]
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["club", id],
    queryFn: () => clubAPI.getById(id!),
    enabled: !!id,
  });
  const club = data?.data;

  const isAdmin =
    club &&
    club.members?.some(
      (m: any) =>
        m.status === "active" &&
        m.role === "admin" &&
        (m.user?._id ?? m.user) === user?._id
    );

  const { data: requestsData } = useQuery({
    queryKey: ["club-requests", id],
    queryFn: () => clubAPI.getRequests(id!),
    enabled: !!id && !!isAdmin,
  });
  const requests = requestsData?.data ?? [];

  const { data: gamesData } = useQuery({
    queryKey: ["club-games", id],
    queryFn: () => clubAPI.getGames(id!),
    enabled: !!id && !!isAdmin,
  });
  const games = gamesData?.data ?? [];

  const { data: announcementsData } = useQuery({
    queryKey: ["club-announcements", id],
    queryFn: () => clubAPI.getAnnouncements(id!),
    enabled: !!id && !!isAdmin,
  });
  const announcements = announcementsData?.data ?? [];

  const [settingsForm, setSettingsForm] = useState<any | null>(null);
  if (club && !settingsForm) {
    setSettingsForm({
      name: club.name ?? "",
      description: club.description ?? "",
      location: club.location ?? "",
      address: club.address ?? "",
      joinType: club.joinType ?? "open",
      isPublic: club.settings?.isPublic ?? true,
      maxMembers: club.settings?.maxMembers ?? 0,
    });
  }

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      clubAPI.update(id!, {
        name: settingsForm.name,
        description: settingsForm.description,
        location: settingsForm.location,
        address: settingsForm.address,
        joinType: settingsForm.joinType,
        settings: {
          isPublic: settingsForm.isPublic,
          maxMembers: Number(settingsForm.maxMembers) || 0,
        },
      }),
    onSuccess: () => {
      toast({ title: "Club updated" });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't save changes",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => clubAPI.approveRequest(id!, userId),
    onSuccess: () => {
      toast({ title: "Request approved" });
      queryClient.invalidateQueries({ queryKey: ["club-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => clubAPI.rejectRequest(id!, userId),
    onSuccess: () => {
      toast({ title: "Request rejected" });
      queryClient.invalidateQueries({ queryKey: ["club-requests", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "member" }) =>
      clubAPI.updateMemberRole(id!, userId, role),
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => clubAPI.removeMember(id!, userId),
    onSuccess: () => {
      toast({ title: "Member removed" });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const [addMemberEmail, setAddMemberEmail] = useState("");
  const addMemberMutation = useMutation({
    mutationFn: (email: string) => clubAPI.addMember(id!, email),
    onSuccess: () => {
      toast({ title: "Member added" });
      setAddMemberEmail("");
      queryClient.invalidateQueries({ queryKey: ["club", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't add member",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const [announcementMessage, setAnnouncementMessage] = useState("");
  const postAnnouncementMutation = useMutation({
    mutationFn: (message: string) => clubAPI.createAnnouncement(id!, message),
    onSuccess: () => {
      toast({ title: "Announcement posted" });
      setAnnouncementMessage("");
      queryClient.invalidateQueries({ queryKey: ["club-announcements", id] });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't post announcement",
        description: err?.response?.data?.message,
        variant: "destructive",
      });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => clubAPI.deleteAnnouncement(id!, announcementId),
    onSuccess: () => {
      toast({ title: "Announcement deleted" });
      queryClient.invalidateQueries({ queryKey: ["club-announcements", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const cancelGameMutation = useMutation({
    mutationFn: (gameId: string) => clubAPI.cancelGame(id!, gameId),
    onSuccess: () => {
      toast({ title: "Game cancelled" });
      queryClient.invalidateQueries({ queryKey: ["club-games", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clubAPI.delete(id!),
    onSuccess: () => {
      toast({ title: "Club deleted" });
      navigate("/clubs");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.response?.data?.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-4 rounded bg-pb-surface2 w-24" />
          <div className="h-10 rounded bg-pb-surface2 w-1/2" />
        </div>
      </Layout>
    );
  }

  if (!club || !isAdmin) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
            Not authorized
          </h2>
          <Link
            to="/clubs"
            className="mt-4 inline-flex items-center gap-1.5 border border-pb-hairline rounded-[6px] font-mono text-[12px] text-pb-ink px-4 h-9 hover:bg-pb-surface2 transition-colors"
          >
            Back to Clubs
          </Link>
        </div>
      </Layout>
    );
  }

  const activeMembers = club.members?.filter((m: any) => m.status === "active") ?? [];
  const activeAdminCount = activeMembers.filter((m: any) => m.role === "admin").length;

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="mb-6">
            <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-5 min-w-0">
                <Link
                  to={`/clubs/${club._id}`}
                  className="shrink-0 w-10 h-10 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center text-pb-muted hover:text-pb-ink hover:bg-pb-surface transition-colors self-start"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display font-extrabold text-[28px] sm:text-[32px] tracking-[-0.03em] text-pb-ink truncate">
                    {club.name}
                  </h1>
                  <p className="font-mono text-[12px] text-pb-muted mt-1">
                    {activeMembers.length} member{activeMembers.length === 1 ? "" : "s"} ·{" "}
                    {JOIN_TYPES.find((j) => j.value === club.joinType)?.label ?? club.joinType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-pb-hairline overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex items-center gap-2 border border-red-300 text-red-600 rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 shrink-0 hover:bg-red-50 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  Delete Club
                </button>
              </div>
            </div>
          </div>

          <MobileClubNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            requestCount={requests.length}
          />

          <div className="flex gap-8 items-start">
            <ClubSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              requestCount={requests.length}
            />

            <div className="flex-1 min-w-0">
              {activeSection === "overview" && settingsForm && (
                <div className="space-y-5">
                  <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                      Post Announcement
                    </h3>
                    <p className="font-mono text-[12px] text-pb-muted -mt-2">
                      Sends a notification to every active member.
                    </p>
                    <Textarea
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      placeholder="Courts closed this Saturday for maintenance..."
                      rows={3}
                      className="resize-none"
                    />
                    <button
                      onClick={() => announcementMessage.trim() && postAnnouncementMutation.mutate(announcementMessage.trim())}
                      disabled={postAnnouncementMutation.isPending || !announcementMessage.trim()}
                      className="bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {postAnnouncementMutation.isPending ? "Posting..." : "Post Announcement"}
                    </button>

                    {announcements.length > 0 && (
                      <div className="pt-4 mt-2 border-t border-pb-hairline space-y-3">
                        {announcements.map((a: any) => (
                          <div key={a._id} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] text-pb-ink leading-relaxed whitespace-pre-wrap">
                                {a.message}
                              </p>
                              <p className="font-mono text-[11px] text-pb-muted mt-1">
                                {a.postedBy?.name ?? "Admin"} ·{" "}
                                {a.createdAt ? format(new Date(a.createdAt), "MMM d, h:mm a") : ""}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteAnnouncementMutation.mutate(a._id)}
                              disabled={deleteAnnouncementMutation.isPending}
                              className="shrink-0 font-mono text-[11px] text-red-600 hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                      Basic Info
                    </h3>
                    <div>
                      <Label className={fieldLabel}>Name</Label>
                      <Input
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm((f: any) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className={fieldLabel}>Description</Label>
                      <Textarea
                        value={settingsForm.description}
                        onChange={(e) =>
                          setSettingsForm((f: any) => ({ ...f, description: e.target.value }))
                        }
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className={fieldLabel}>Location</Label>
                        <Input
                          value={settingsForm.location}
                          onChange={(e) =>
                            setSettingsForm((f: any) => ({ ...f, location: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label className={fieldLabel}>Address</Label>
                        <Input
                          value={settingsForm.address}
                          onChange={(e) =>
                            setSettingsForm((f: any) => ({ ...f, address: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                      Who Can Join
                    </h3>
                    <Select
                      value={settingsForm.joinType}
                      onValueChange={(v) => setSettingsForm((f: any) => ({ ...f, joinType: v }))}
                    >
                      <SelectTrigger className="bg-pb-paper border-pb-hairline font-mono text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JOIN_TYPES.map((jt) => (
                          <SelectItem key={jt.value} value={jt.value}>
                            {jt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-5">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                      Settings
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[13px] text-pb-ink">Public club</p>
                        <p className="font-mono text-[12px] text-pb-muted">
                          Show this club in the public browse list
                        </p>
                      </div>
                      <Switch
                        checked={settingsForm.isPublic}
                        onCheckedChange={(checked) =>
                          setSettingsForm((f: any) => ({ ...f, isPublic: checked }))
                        }
                      />
                    </div>
                    <div>
                      <Label className={fieldLabel}>Max Members (0 = unlimited)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={settingsForm.maxMembers}
                        onChange={(e) =>
                          setSettingsForm((f: any) => ({ ...f, maxMembers: e.target.value }))
                        }
                        className="max-w-[160px]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => saveSettingsMutation.mutate()}
                    disabled={saveSettingsMutation.isPending}
                    className="inline-flex items-center gap-2 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-5 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <FloppyDisk className="w-4 h-4" />
                    {saveSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {activeSection === "requests" && (
                <div>
                  <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink mb-5">
                    Pending Requests
                  </h3>
                  {requests.length === 0 ? (
                    <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                      <UserPlus className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                      <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                        No pending requests
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {requests.map((r: any) => (
                        <div
                          key={r._id}
                          className="bg-pb-surface border border-pb-hairline rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                              <span className="font-mono text-[13px] font-bold text-pb-ink">
                                {r.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-[13px] text-pb-ink truncate">{r.user?.name}</p>
                              <p className="font-mono text-[11px] text-pb-muted truncate">{r.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => approveMutation.mutate(r.user?._id ?? r.user)}
                              disabled={approveMutation.isPending}
                              className="inline-flex items-center gap-1.5 bg-pb-court text-white rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] h-8 px-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(r.user?._id ?? r.user)}
                              disabled={rejectMutation.isPending}
                              className="inline-flex items-center gap-1.5 border border-pb-hairline text-pb-ink rounded-[6px] font-mono text-[11px] uppercase tracking-[0.06em] h-8 px-3 hover:bg-pb-surface2 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "members" && (
                <div>
                  <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink mb-5">
                    Members
                  </h3>

                  <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-4 mb-4">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-2">
                      Add Member by Email
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (addMemberEmail.trim()) addMemberMutation.mutate(addMemberEmail.trim());
                      }}
                      className="flex flex-col sm:flex-row gap-2"
                    >
                      <Input
                        type="email"
                        value={addMemberEmail}
                        onChange={(e) => setAddMemberEmail(e.target.value)}
                        placeholder="player@example.com"
                        className="flex-1"
                      />
                      <button
                        type="submit"
                        disabled={addMemberMutation.isPending || !addMemberEmail.trim()}
                        className="inline-flex items-center justify-center gap-1.5 bg-pb-court text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-4 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        {addMemberMutation.isPending ? "Adding..." : "Add"}
                      </button>
                    </form>
                    {club.joinType === "invite-only" && (
                      <p className="font-mono text-[11px] text-pb-muted mt-2">
                        This club is invite-only, so this is the only way for someone to join.
                      </p>
                    )}
                  </div>

                  <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm divide-y divide-pb-hairline">
                        <thead className="bg-pb-surface2">
                          <tr>
                            {["Member", "Role", "Joined", ""].map((h) => (
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
                          {activeMembers.map((m: any) => {
                            const memberId = m.user?._id ?? m.user;
                            const isLastAdmin = m.role === "admin" && activeAdminCount <= 1;
                            return (
                              <tr key={m._id} className="hover:bg-pb-surface2/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-[6px] bg-pb-surface2 border border-pb-hairline flex items-center justify-center shrink-0">
                                      <span className="font-mono text-[11px] font-bold text-pb-ink">
                                        {m.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-mono text-[13px] text-pb-ink">{m.user?.name}</p>
                                      <p className="font-mono text-[11px] text-pb-muted">{m.user?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Select
                                    value={m.role}
                                    onValueChange={(v) =>
                                      roleMutation.mutate({ userId: memberId, role: v as "admin" | "member" })
                                    }
                                    disabled={isLastAdmin}
                                  >
                                    <SelectTrigger className="h-8 w-[120px] bg-pb-paper border-pb-hairline font-mono text-[12px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Admin</SelectItem>
                                      <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px] text-pb-muted">
                                  {m.joinedAt ? format(new Date(m.joinedAt), "MMM d, yyyy") : "—"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => removeMemberMutation.mutate(memberId)}
                                    disabled={removeMemberMutation.isPending}
                                    className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-50"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "games" && (
                <div>
                  <h3 className="font-display font-bold text-[20px] tracking-[-0.02em] text-pb-ink mb-5">
                    Games
                  </h3>
                  {games.length === 0 ? (
                    <div className="text-center py-16 bg-pb-surface border border-pb-hairline rounded-[8px]">
                      <CalendarBlank className="w-9 h-9 mx-auto mb-3 text-pb-muted opacity-40" />
                      <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-pb-muted">
                        No games scheduled yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {games.map((g: any) => {
                        const goingCount = g.rsvps?.filter((r: any) => r.status === "going").length ?? 0;
                        return (
                          <div
                            key={g._id}
                            className={cn(
                              "bg-pb-surface border border-pb-hairline rounded-[8px] p-4 flex items-center justify-between gap-3",
                              g.status === "cancelled" && "opacity-60"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="font-mono text-[13px] font-bold text-pb-ink">
                                {g.date ? format(new Date(g.date), "EEE, MMM d · h:mm a") : "—"}
                              </p>
                              <p className="font-mono text-[12px] text-pb-muted mt-0.5">
                                {g.location} · {goingCount}/{g.maxPlayers} going
                              </p>
                            </div>
                            <div className="shrink-0">
                              {g.status === "cancelled" ? (
                                <span className="font-mono text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[4px] bg-red-500/10 text-red-600 border border-red-500/30">
                                  Cancelled
                                </span>
                              ) : (
                                <button
                                  onClick={() => cancelGameMutation.mutate(g._id)}
                                  disabled={cancelGameMutation.isPending}
                                  className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-pb-paper border border-pb-hairline rounded-[8px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-[18px] tracking-[-0.02em] text-red-600">
              Delete Club?
            </DialogTitle>
          </DialogHeader>
          <p className="font-mono text-[13px] text-pb-muted leading-relaxed">
            This permanently deletes the club, its members list, and all scheduled games. This cannot be
            undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className="border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-9 px-4 hover:bg-pb-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteMutation.mutate();
                setDeleteDialogOpen(false);
              }}
              className="bg-red-600 text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-9 px-4 hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <Trash className="w-4 h-4" />
              Yes, Delete Club
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
