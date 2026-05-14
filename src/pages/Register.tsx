import Layout from "@/components/layout/Layout";
import PaymentForm from "@/components/payment/PaymentForm";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { eventAPI, invitationAPI, paymentAPI, teamAPI, tournamentAPI } from "@/services/api";
import { formatEventSkillLevel } from "@/types/tournament";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Warning, ArrowLeft, Calendar, Check, CircleNotch,
  Envelope, MapPin, Phone, ShieldCheck, Trophy,
  User, UserPlus, CaretDown,
} from "@phosphor-icons/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Eyebrow, Pill, PbBtn, PbCard, PbAvatar, Dot } from "@/components/ui/pb";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface EventSelection {
  eventId: string;
  event: any;
  partnerName?: string;
  partnerEmail?: string;
}

type SortOption = "startTime" | "price";

// ─── Inline partner field ──────────────────────────────────────────────────────

function PartnerField({
  label, placeholder, value, onChange, type = "text",
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-pb-muted">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2.5 text-[12px] font-mono bg-white border border-pb-hairline rounded-[4px] text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule transition-colors"
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const Register = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedEvents, setSelectedEvents] = useState<EventSelection[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<Array<{
    eventId: string; teamId: string; amount: number; eventName: string;
  }>>([]);

  // Partner modal state
  const [partnerModalEvent, setPartnerModalEvent] = useState<any>(null);
  const [partnerFields, setPartnerFields] = useState({ name: "", email: "" });

  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter]   = useState<string>("all");
  const [sortBy, setSortBy]             = useState<SortOption>("startTime");

  // ── Data ────────────────────────────────────────────────────────────────────

  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["events", id],
    queryFn: () => eventAPI.getByTournament(id!),
    enabled: !!id,
  });

  const { data: myTeamsData } = useQuery({
    queryKey: ["myTeams"],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!user,
  });

  useEffect(() => {
    if (user && id) {
      const pendingStr = localStorage.getItem("pendingRegistration");
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.tournamentId === id && pending.selections) {
            setSelectedEvents(pending.selections);
            toast.success("Your cart has been restored.");
          }
          localStorage.removeItem("pendingRegistration");
        } catch (e) {
          console.error("Failed to parse pending registration", e);
        }
      }
    }
  }, [user, id]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const createAllTeamsMutation = useMutation({
    mutationFn: async (selections: EventSelection[]) => {
      const singlesEvents = selections.filter((sel) => sel.event.format === "singles");
      const teamEvents    = selections.filter((sel) => sel.event.format !== "singles");

      const teamPromises = teamEvents.map(async (selection) => {
        const teamName = `${user?.name} & ${selection.partnerName || "Partner"}`;
        const teamResponse = await teamAPI.create(selection.eventId, {
          name: teamName, players: [user?._id],
        });
        if (selection.partnerEmail && teamResponse.data) {
          try {
            await invitationAPI.send(teamResponse.data._id, {
              inviteeEmail: selection.partnerEmail,
              inviteeName: selection.partnerName,
              message: `${user?.name} has registered for ${selection.event.name} at ${tournament?.name} and listed you as their partner. Register and pay your entry fee to complete the team.`,
              sendEmail: true,
            });
          } catch (e) { console.error("Invite failed:", e); }
        }
        return { eventId: selection.eventId, teamId: teamResponse.data._id, isSingles: false };
      });

      const createdTeams = await Promise.all(teamPromises);
      return [
        ...createdTeams,
        ...singlesEvents.map((sel) => ({ eventId: sel.eventId, teamId: null, isSingles: true })),
      ];
    },
    onSuccess: async (teamRegistrations) => {
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      const totalFee = selectedEvents.reduce((sum, sel) => sum + (sel.event.entryFee || 0), 0);
      if (totalFee > 0) {
        try {
          const res = await paymentAPI.createMultiEventIntent({ eventRegistrations: teamRegistrations });
          if (res.data.requiresPayment) {
            setClientSecret(res.data.clientSecret);
            setEventBreakdown(res.data.eventBreakdown);
            setIsPaymentDialogOpen(true);
          } else {
            toast.success("Registered successfully!");
            setSelectedEvents([]);
            navigate("/registration-success", {
              state: { tournamentName: tournamentData?.data?.name, eventIds: teamRegistrations.map((r) => r.eventId) },
            });
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || "Failed to set up payment");
        }
      } else {
        toast.success("Registered successfully!");
        setSelectedEvents([]);
        navigate("/registration-success", {
          state: { tournamentName: tournamentData?.data?.name, eventIds: teamRegistrations.map((r) => r.eventId) },
        });
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create teams"),
  });

  // ── Derived state ───────────────────────────────────────────────────────────

  const tournament = tournamentData?.data;
  const events     = eventsData?.data || [];
  const myTeams    = myTeamsData?.data || [];

  const teamEventIds = myTeams
    .filter((t: any) => t.paymentStatus === "paid")
    .map((t: any) => t.event?._id || t.event).filter(Boolean).map(String);

  const singlesEventIds = events
    .filter((event: any) =>
      event.registeredPlayers?.some((reg: any) =>
        reg?.player && user?._id &&
        String(reg.player?._id || reg.player) === String(user._id) &&
        reg.paymentStatus === "paid"
      )
    ).map((event: any) => String(event._id));

  const registeredEventIds = [...new Set([...teamEventIds, ...singlesEventIds])];
  const cartTotal = selectedEvents.reduce((sum, sel) => sum + (sel.event.entryFee || 0), 0);

  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (formatFilter !== "all") {
      list = list.filter((e: any) => {
        if (formatFilter === "singles") return e.format === "singles";
        if (formatFilter === "doubles") return e.format === "doubles";
        if (formatFilter === "mixed")   return e.format === "mixed-doubles";
        return true;
      });
    }
    if (skillFilter !== "all") {
      list = list.filter((e: any) => {
        const num = parseFloat(String(e.skillLevel || "").replace("+", "")) || 0;
        if (skillFilter === "3.0") return num <= 3.5;
        if (skillFilter === "4.5") return num >= 4.0;
        return true;
      });
    }
    if (sortBy === "price") list.sort((a: any, b: any) => (a.entryFee || 0) - (b.entryFee || 0));
    else list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    return list;
  }, [events, formatFilter, skillFilter, sortBy]);

  const openCount = filteredEvents.filter(
    (e: any) => (e.currentTeams || 0) < (e.maxTeams || 0) && !registeredEventIds.includes(String(e._id))
  ).length;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const isDoublesFormat = (event: any) =>
    event.format === "doubles" || event.format === "mixed-doubles";

  const handleEventToggle = (event: any) => {
    if (registeredEventIds.includes(String(event._id))) {
      toast.error("You are already registered for this event");
      return;
    }
    const isSelected = selectedEvents.some((sel) => sel.eventId === event._id);
    if (isSelected) {
      setSelectedEvents((prev) => prev.filter((sel) => sel.eventId !== event._id));
    } else if (isDoublesFormat(event)) {
      // Open partner modal instead of adding directly
      setPartnerFields({ name: "", email: "" });
      setPartnerModalEvent(event);
    } else {
      setSelectedEvents((prev) => [...prev, { eventId: event._id, event, partnerName: "", partnerEmail: "" }]);
    }
  };

  const handlePartnerModalConfirm = (skip = false) => {
    if (!partnerModalEvent) return;
    setSelectedEvents((prev) => [
      ...prev,
      {
        eventId: partnerModalEvent._id,
        event: partnerModalEvent,
        partnerName: skip ? "" : partnerFields.name,
        partnerEmail: skip ? "" : partnerFields.email,
      },
    ]);
    setPartnerModalEvent(null);
  };

  const handlePartnerUpdate = (eventId: string, field: "partnerName" | "partnerEmail", value: string) => {
    setSelectedEvents((prev) =>
      prev.map((sel) => (sel.eventId === eventId ? { ...sel, [field]: value } : sel))
    );
  };

  const handleProceedToCheckout = () => {
    if (selectedEvents.length === 0) { toast.error("Select at least one event"); return; }
    if (!user) {
      localStorage.setItem("pendingRegistration", JSON.stringify({ tournamentId: id, selections: selectedEvents }));
      navigate(`/auth?redirect=/tournaments/${id}/register`);
      return;
    }
    const missingPartner = selectedEvents.filter(
      (sel) => (sel.event.format === "doubles" || sel.event.format === "mixed-doubles") && !sel.partnerName
    );
    if (missingPartner.length > 0) toast.info("You can add partner info later from the Teams page");
    createAllTeamsMutation.mutate(selectedEvents);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setClientSecret(null);
    setEventBreakdown([]);
    setSelectedEvents([]);
    navigate("/registration-success", { state: { tournamentName: tournamentData?.data?.name } });
  };

  const handlePaymentCancel = () => {
    setIsPaymentDialogOpen(false);
    const hasSingles = selectedEvents.some((s) => s.event.format === "singles");
    const hasTeams   = selectedEvents.some((s) => s.event.format !== "singles");
    if (hasSingles && !hasTeams) navigate(`/tournaments/${id}`);
    else if (hasTeams && !hasSingles) navigate("/teams");
    else navigate(`/tournaments/${id}`);
  };

  const organizer     = tournament?.organizer;
  const organizerName = organizer?.name || "Tournament Organizer";
  const city          = tournament?.location?.split(",")[0]?.trim() || tournament?.location || "";

  // Entry fee range
  const fees   = (events).map((e: any) => e.entryFee || 0).filter((f: number) => f > 0);
  const minFee = fees.length ? Math.min(...fees) : null;
  const maxFee = fees.length ? Math.max(...fees) : null;

  // ── Loading / error states ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <CircleNotch size={28} className="animate-spin text-pb-muted" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <div className="text-center">
            <Warning size={32} className="mx-auto mb-3 text-pb-faint" />
            <h2 className="font-display font-bold text-[22px] tracking-[-0.025em] text-pb-ink mb-2">
              Tournament not found
            </h2>
            <p className="text-[13px] text-pb-muted mb-5">This tournament doesn't exist.</p>
            <PbBtn variant="outline" size="md" onClick={() => navigate("/tournaments")}>
              <ArrowLeft size={14} /> Back to Tournaments
            </PbBtn>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Layout variant="minimal">
      <div className="min-h-screen bg-pb-paper">

        {/* ── Mobile checkout layout ── */}
        <div className="md:hidden flex flex-col min-h-screen bg-pb-paper">

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pb-3 bg-pb-surface border-b border-pb-hairline sticky top-0 z-30" style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>
            <Link to={`/tournaments/${id}`} className="text-pb-muted">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-display font-bold text-[16px] text-pb-ink">Confirm &amp; pay</h1>
            <div className="w-9" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-32">

            {/* YOU'RE REGISTERING */}
            <div>
              <Eyebrow className="mb-2">YOU'RE REGISTERING</Eyebrow>
              <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink leading-tight mb-1">
                {tournament.name}
              </h2>
              {selectedEvents.length > 0 && (
                <p className="font-display italic text-pb-court text-[15px] leading-snug mb-1">
                  {selectedEvents.map(s => s.event.name).join(", ")}
                </p>
              )}
              <p className="font-mono text-[11px] text-pb-muted">
                {tournament.startDate && format(new Date(tournament.startDate), "EEE, MMM d")}
                {" · "}
                {tournament.location}
              </p>
            </div>

            {/* Event picker (mobile) */}
            <div>
              <Eyebrow className="mb-3">CHOOSE EVENTS</Eyebrow>
              <div className="space-y-2">
                {filteredEvents.map((event: any) => {
                  const isFull = (event.currentTeams || 0) >= (event.maxTeams || 0);
                  const isAlreadyRegistered = registeredEventIds.includes(String(event._id));
                  const isSelected = selectedEvents.some((sel) => sel.eventId === event._id);
                  const isDisabled = isFull || isAlreadyRegistered;
                  const spotsLeft = Math.max(0, (event.maxTeams || 0) - (event.currentTeams || 0));

                  return (
                    <div
                      key={event._id}
                      onClick={() => !isDisabled && handleEventToggle(event)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-[8px] border transition-colors cursor-pointer",
                        isSelected ? "border-pb-ink bg-pb-surface" : "border-pb-hairline bg-pb-surface",
                        isDisabled && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-[14px] text-pb-ink leading-snug truncate">{event.name}</p>
                        <p className="font-mono text-[10px] text-pb-muted mt-0.5">
                          {spotsLeft} spots · {event.entryFee > 0 ? `$${event.entryFee}` : "Free"}
                        </p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3",
                        isSelected ? "border-pb-ink bg-pb-ink" : "border-pb-rule"
                      )}>
                        {isSelected && <Check size={10} weight="bold" className="text-white" />}
                        {isAlreadyRegistered && <Check size={10} weight="bold" className="text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ORDER SUMMARY */}
            {selectedEvents.length > 0 && (
              <div>
                <Eyebrow className="mb-3">ORDER</Eyebrow>
                <div className="bg-pb-surface border border-pb-hairline rounded-[8px] overflow-hidden">
                  <div className="divide-y divide-pb-hairline">
                    {selectedEvents.map((sel) => (
                      <div key={sel.eventId} className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1 min-w-0 mr-2">
                          <span className="text-[13px] font-medium text-pb-ink truncate block">{sel.event.name}</span>
                          {isDoublesFormat(sel.event) && (
                            <span className="text-[10px] font-mono text-pb-muted">
                              {sel.partnerName ? `w/ ${sel.partnerName}` : "No partner yet"}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[13px] text-pb-court shrink-0">
                          {sel.event.entryFee > 0 ? `$${sel.event.entryFee}` : "Free"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-dashed border-pb-rule">
                    <Eyebrow>TOTAL</Eyebrow>
                    <span className="font-mono text-[22px] font-medium text-pb-ink">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky bottom CTA */}
          {selectedEvents.length > 0 && (
            <div className="fixed left-0 right-0 bg-pb-surface border-t border-pb-hairline px-4 py-3 z-40" style={{ bottom: 'calc(64px + max(env(safe-area-inset-bottom), 0px))' }}>
              <PbBtn
                variant="primary"
                size="lg"
                full
                onClick={handleProceedToCheckout}
                disabled={createAllTeamsMutation.isPending}
              >
                {createAllTeamsMutation.isPending ? (
                  <><CircleNotch size={15} className="animate-spin" /> Processing…</>
                ) : (
                  `Pay $${cartTotal.toFixed(2)}`
                )}
              </PbBtn>
              <p className="text-center font-mono text-[10px] text-pb-faint mt-1.5">
                Secure payment · 256-bit encryption
              </p>
            </div>
          )}
        </div>

        {/* ── Hero — matches PlayerTournamentView layout (desktop) ─────────── */}
        <div className="hidden md:block max-w-[1200px] mx-auto px-6 pt-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] font-mono text-pb-muted mb-6">
            <Link to="/tournaments" className="hover:text-pb-ink transition-colors">Tournaments</Link>
            <span>›</span>
            <Link to={`/tournaments?search=${encodeURIComponent(city)}`} className="hover:text-pb-ink transition-colors">{city}</Link>
            <span>›</span>
            <Link to={`/tournaments/${id}`} className="hover:text-pb-ink transition-colors">{tournament.name}</Link>
            <span>›</span>
            <span className="text-pb-ink">Register</span>
          </nav>

          {/* Title block */}
          <div className="pb-8 border-b border-pb-hairline">
            <p className="text-[11px] font-mono text-pb-muted tracking-[0.08em] uppercase mb-3">
              {[
                tournament.startDate && tournament.endDate &&
                  `${format(new Date(tournament.startDate), "EEE d")} — ${format(new Date(tournament.endDate), "EEE d MMM yyyy")}`.toUpperCase(),
                tournament.maxPlayers && `${tournament.maxPlayers} Players`,
                events.length && `${events.length} Events`,
              ].filter(Boolean).join(" · ")}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="font-display font-extrabold text-[clamp(32px,4vw,60px)] tracking-[-0.04em] leading-[0.95] text-pb-ink">
                  {tournament.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Pill tone="court">Registration open</Pill>
                  {tournament.format && <Pill tone="neutral" mono>{tournament.format}</Pill>}
                  {organizer?.name && (
                    <span className="text-[12px] font-mono text-pb-muted">
                      · hosted by {organizer.name}
                    </span>
                  )}
                </div>
              </div>
              <Link to={`/tournaments/${id}`}>
                <PbBtn variant="ghost" size="sm" className="shrink-0 text-pb-muted">
                  <ArrowLeft size={13} /> Back to details
                </PbBtn>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Content grid (desktop only) ───────────────────────────────── */}
        <div className="hidden md:block max-w-[1200px] mx-auto px-6 pt-8 pb-16">
          <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">

            {/* ── Left: event selection ──────────────────────────────────── */}
            <div className="min-w-0 space-y-6">

              {/* Events card — matches "Choose your event" in detail page */}
              <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">

                {/* Card header */}
                <div className="px-5 pt-5 pb-4 border-b border-pb-hairline flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono text-pb-muted uppercase tracking-[0.1em]">
                      {events.length} EVENT{events.length !== 1 ? "S" : ""}
                      {openCount > 0 && ` · ${openCount} OPEN`}
                    </p>
                    <h2 className="font-display font-bold text-[20px] tracking-[-0.025em] text-pb-ink mt-1">
                      Choose your events
                    </h2>
                  </div>

                  {/* Filter chips in header */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                    {[
                      { id: "all", label: "All formats" },
                      { id: "singles", label: "Singles" },
                      { id: "doubles", label: "Doubles" },
                      { id: "mixed", label: "Mixed" },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => setFormatFilter(chip.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-colors",
                          formatFilter === chip.id
                            ? "bg-pb-ink text-white"
                            : "border border-pb-hairline text-pb-muted hover:border-pb-rule hover:text-pb-ink"
                        )}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skill + sort bar */}
                <div className="px-5 py-2.5 border-b border-pb-hairline flex items-center justify-between bg-pb-surface2">
                  <div className="flex items-center gap-1.5">
                    <Eyebrow>Skill</Eyebrow>
                    {[
                      { id: "all", label: "Any" },
                      { id: "3.0", label: "3.0 +" },
                      { id: "4.5", label: "4.5 +" },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        onClick={() => setSkillFilter(chip.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-mono transition-colors",
                          skillFilter === chip.id
                            ? "bg-pb-ink text-white"
                            : "text-pb-muted hover:text-pb-ink"
                        )}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eyebrow>Sort</Eyebrow>
                    <span className="text-pb-faint text-[10px]">·</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-[11px] font-mono text-pb-ink bg-transparent border-0 focus:outline-none cursor-pointer uppercase tracking-[0.06em]"
                    >
                      <option value="startTime">Name</option>
                      <option value="price">Price</option>
                    </select>
                  </div>
                </div>

                {/* Column headers */}
                <div
                  className="grid gap-4 px-5 py-2.5 border-b border-pb-hairline"
                  style={{ gridTemplateColumns: "1fr 72px 52px 1fr 88px" }}
                >
                  <Eyebrow>Event</Eyebrow>
                  <Eyebrow>Spots</Eyebrow>
                  <Eyebrow>Fee</Eyebrow>
                  <Eyebrow>Status</Eyebrow>
                  <span />
                </div>

                {/* Event rows */}
                {filteredEvents.length === 0 ? (
                  <div className="py-14 text-center">
                    <Trophy size={24} className="mx-auto mb-3 text-pb-faint" />
                    <p className="text-[13px] text-pb-muted">No events match your filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-pb-hairline">
                    {filteredEvents.map((event: any) => {
                      const isFull              = (event.currentTeams || 0) >= (event.maxTeams || 0);
                      const isAlreadyRegistered = registeredEventIds.includes(String(event._id));
                      const isSelected          = selectedEvents.some((sel) => sel.eventId === event._id);
                      const selection           = selectedEvents.find((sel) => sel.eventId === event._id);
                      const needsPartner        = event.format === "doubles" || event.format === "mixed-doubles";
                      const hasUnpaidReg        = myTeams.some(
                        (t: any) =>
                          String(t.event?._id || t.event) === String(event._id) && t.paymentStatus === "unpaid"
                      );
                      const isDisabled  = isFull || isAlreadyRegistered;
                      const spotsLeft   = Math.max(0, (event.maxTeams || 0) - (event.currentTeams || 0));
                      const formatLabel =
                        event.format === "mixed-doubles" ? "Mixed Doubles" :
                        (event.format || "").charAt(0).toUpperCase() + (event.format || "").slice(1);

                      return (
                        <div key={event._id}>
                          {/* Main row */}
                          <div
                            onClick={() => !isDisabled && handleEventToggle(event)}
                            className={cn(
                              "grid gap-4 px-5 py-4 transition-colors items-center",
                              isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-pb-surface2",
                              isSelected && "bg-pb-court-tint2 hover:bg-pb-court-tint2",
                              isSelected && "border-l-2 border-pb-court"
                            )}
                            style={{ gridTemplateColumns: "1fr 72px 52px 1fr 88px" }}
                          >
                            {/* Event name + skill */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display font-bold text-[15px] tracking-[-0.02em] text-pb-ink leading-snug">
                                  {event.name}
                                </span>
                                {event.skillLevel && (
                                  <Pill tone="neutral" className="text-[11px] shrink-0">
                                    {formatEventSkillLevel(event.skillLevel)}
                                  </Pill>
                                )}
                                {isAlreadyRegistered && <Pill tone="court" mono>Registered</Pill>}
                                {hasUnpaidReg && <Pill tone="amber" mono>Pending</Pill>}
                              </div>
                              <p className="text-[11px] font-mono text-pb-muted mt-0.5">{formatLabel}</p>
                            </div>

                            {/* Spots */}
                            <div className="font-mono text-[13px] text-pb-ink whitespace-nowrap">
                              {event.currentTeams || 0}/{event.maxTeams || 0}
                            </div>

                            {/* Fee */}
                            <div className={cn(
                              "font-mono text-[13px] font-medium",
                              isSelected ? "text-pb-court" : "text-pb-ink"
                            )}>
                              {event.entryFee > 0 ? `$${event.entryFee}` : "Free"}
                            </div>

                            {/* Status pill */}
                            <div>
                              {isFull && !isAlreadyRegistered ? (
                                <Pill tone="ink" mono>Full</Pill>
                              ) : isAlreadyRegistered ? (
                                <Pill tone="court" className="inline-flex items-center gap-1.5">
                                  <Check size={10} weight="bold" /> Registered
                                </Pill>
                              ) : spotsLeft <= 8 ? (
                                <Pill tone="amber" className="whitespace-nowrap text-[11px]">
                                  Open · {spotsLeft} left
                                </Pill>
                              ) : (
                                <Pill tone="neutral" className="whitespace-nowrap text-[11px]">
                                  Open · {spotsLeft} left
                                </Pill>
                              )}
                            </div>

                            {/* CTA */}
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              {!isDisabled && (
                                <button
                                  onClick={() => handleEventToggle(event)}
                                  className={cn(
                                    "h-8 px-3 rounded-[6px] border text-[12px] font-sans font-medium transition-colors whitespace-nowrap",
                                    isSelected
                                      ? "bg-pb-court border-pb-court text-white"
                                      : "bg-transparent border-pb-rule text-pb-ink2 hover:border-pb-ink hover:text-pb-ink"
                                  )}
                                >
                                  {isSelected ? (
                                    <span className="flex items-center gap-1.5">
                                      <Check size={11} weight="bold" /> Added
                                    </span>
                                  ) : "Add →"}
                                </button>
                              )}
                              {isFull && !isAlreadyRegistered && tournament?.settings?.allowWaitlist && (
                                <Link
                                  to={`/tournaments/${id}/register/${event._id}`}
                                  className="h-8 px-3 rounded-[6px] border border-pb-hairline text-[12px] font-mono text-pb-muted hover:text-pb-ink hover:border-pb-rule transition-colors flex items-center"
                                >
                                  Waitlist
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Partner fields — inline expand when doubles selected */}
                          {isSelected && needsPartner && (
                            <div
                              className="px-5 pb-4 bg-pb-court-tint2 border-l-2 border-pb-court"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="pt-3 border-t border-pb-court/20">
                                <p className="text-[11px] font-mono text-pb-court uppercase tracking-[0.1em] mb-2.5">
                                  Partner details <span className="text-pb-muted normal-case tracking-normal">(optional — invite later if needed)</span>
                                </p>
                                <div className="grid sm:grid-cols-2 gap-2">
                                  <PartnerField
                                    label="Partner name"
                                    placeholder="Full name"
                                    value={selection?.partnerName || ""}
                                    onChange={(v) => handlePartnerUpdate(event._id, "partnerName", v)}
                                  />
                                  <PartnerField
                                    label="Partner email"
                                    placeholder="email@example.com"
                                    type="email"
                                    value={selection?.partnerEmail || ""}
                                    onChange={(v) => handlePartnerUpdate(event._id, "partnerEmail", v)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right sidecar ─────────────────────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-[80px]">

              {/* Cart summary — primary action card */}
              <PbCard padded={false}>
                <div className="p-5 border-b border-pb-hairline flex items-center justify-between">
                  <Eyebrow>Your registration</Eyebrow>
                  {selectedEvents.length > 0 && (
                    <Pill tone="court" mono>{selectedEvents.length} selected</Pill>
                  )}
                </div>

                {selectedEvents.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-pb-surface2 border border-pb-hairline flex items-center justify-center mx-auto mb-3">
                      <Trophy size={16} className="text-pb-faint" />
                    </div>
                    <p className="text-[12px] font-mono text-pb-muted">
                      Select events on the left to add them here.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">
                    {/* Line items */}
                    <div className="space-y-3">
                      {selectedEvents.map((sel) => (
                        <div key={sel.eventId} className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-pb-ink leading-snug truncate">
                              {sel.event.name}
                            </p>
                            <p className="text-[10px] font-mono text-pb-muted mt-0.5">
                              {sel.event.format === "mixed-doubles" ? "Mixed Doubles" :
                               (sel.event.format || "").charAt(0).toUpperCase() + (sel.event.format || "").slice(1)}
                              {" · "}
                              {formatEventSkillLevel(sel.event.skillLevel)}
                            </p>
                            {isDoublesFormat(sel.event) && (
                              <p className="text-[10px] font-mono mt-0.5">
                                {sel.partnerName
                                  ? <span className="text-pb-court">w/ {sel.partnerName}</span>
                                  : <span className="text-pb-faint">No partner set</span>
                                }
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[13px] font-medium text-pb-court">
                              {sel.event.entryFee > 0 ? `$${sel.event.entryFee}` : "Free"}
                            </span>
                            <button
                              onClick={() => handleEventToggle(sel.event)}
                              className="w-4 h-4 rounded-full border border-pb-rule text-pb-faint hover:border-destructive hover:text-destructive flex items-center justify-center transition-colors text-[10px]"
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-pb-hairline pt-3 flex items-center justify-between">
                      <Eyebrow>Total</Eyebrow>
                      <span className="font-mono text-[18px] font-medium text-pb-ink leading-none">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Checkout CTA */}
                    <PbBtn
                      variant="primary"
                      size="md"
                      full
                      onClick={handleProceedToCheckout}
                      disabled={createAllTeamsMutation.isPending}
                    >
                      {createAllTeamsMutation.isPending ? (
                        <><CircleNotch size={14} className="animate-spin" /> Processing…</>
                      ) : (
                        <><ArrowRight size={14} /> Proceed to checkout</>
                      )}
                    </PbBtn>
                  </div>
                )}
              </PbCard>

              {/* WHEN card — matches detail page sidecar */}
              <PbCard padded={false}>
                <div className="p-5">
                  <Eyebrow className="mb-3">When</Eyebrow>
                  {tournament.startDate && tournament.endDate && (
                    <div className="font-display font-bold text-[20px] tracking-[-0.03em] text-pb-ink leading-tight">
                      {format(new Date(tournament.startDate), "EEE d")}
                      {" — "}
                      {format(new Date(tournament.endDate), "EEE d MMM")}
                    </div>
                  )}
                  <p className="flex items-center gap-1.5 text-[11px] font-mono text-pb-muted mt-2">
                    <MapPin size={10} /> {tournament.location}
                  </p>
                </div>
                {minFee !== null && (
                  <div className="border-t border-pb-hairline px-5 py-4">
                    <Eyebrow className="mb-1.5">Entry</Eyebrow>
                    <div className="font-mono text-[18px] font-medium text-pb-ink leading-none">
                      {minFee === maxFee ? `$${minFee}` : `$${minFee} — $${maxFee}`}
                    </div>
                  </div>
                )}
                <div className="border-t border-pb-hairline px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono text-pb-muted">
                      {tournament.currentPlayers || 0}/{tournament.maxPlayers} registered
                    </span>
                  </div>
                  <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pb-court rounded-full"
                      style={{ width: `${Math.min(100, ((tournament.currentPlayers || 0) / tournament.maxPlayers) * 100)}%` }}
                    />
                  </div>
                </div>
              </PbCard>

              {/* Organizer */}
              <PbCard padded={false}>
                <div className="p-4 border-b border-pb-hairline">
                  <Eyebrow>Organizer</Eyebrow>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <PbAvatar name={organizerName} size={30} tone="court" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-pb-ink truncate">{organizerName}</p>
                      <p className="text-[10px] font-mono text-pb-muted">Director</p>
                    </div>
                  </div>
                  {organizer?.email && (
                    <a href={`mailto:${organizer.email}`}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-pb-court hover:underline mb-1.5">
                      <Envelope size={10} /> {organizer.email}
                    </a>
                  )}
                  {organizer?.phone && (
                    <p className="flex items-center gap-1.5 text-[11px] font-mono text-pb-muted">
                      <Phone size={10} /> {organizer.phone}
                    </p>
                  )}
                </div>
              </PbCard>
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment dialog (both mobile + desktop) ─────────────────────────── */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { if (!open) handlePaymentCancel(); }}>
        <DialogContent className="max-w-4xl md:max-w-5xl max-h-[90vh] p-0 overflow-y-auto bg-transparent border-none shadow-2xl grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">

          {/* Left: tournament details */}
          <div className="bg-[#07101f] text-white px-8 py-8 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-pb-court flex items-center justify-center shrink-0">
                <Trophy size={20} className="text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-lg tracking-tight">PB Draw</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-mono">Tournament Details</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-mono mb-1.5">Event</p>
                <p className="font-display font-bold text-xl leading-snug">{tournament.name}</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar size={14} className="mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-mono">Date</p>
                    <p className="mt-0.5">
                      {tournament.startDate
                        ? `${format(new Date(tournament.startDate), "PP")} · ${format(new Date(tournament.startDate), "p")}`
                        : "TBA"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="mt-0.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-mono">Location</p>
                    <p className="mt-0.5">{tournament.location}</p>
                  </div>
                </div>
                {user && (
                  <div className="flex items-start gap-3">
                    <User size={14} className="mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-mono">Player</p>
                      <p className="mt-0.5">{user.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected events summary */}
              {selectedEvents.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 font-mono mb-2">Selected events</p>
                  <div className="space-y-1.5">
                    {selectedEvents.map((sel) => (
                      <div key={sel.eventId} className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-300 truncate mr-2">{sel.event.name}</span>
                        <span className="text-white font-mono shrink-0">
                          {sel.event.entryFee > 0 ? `$${sel.event.entryFee}` : "Free"}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-[13px] pt-2 border-t border-white/10 mt-2">
                      <span className="text-slate-400 font-mono uppercase tracking-[0.1em] text-[11px]">Total</span>
                      <span className="text-white font-mono font-medium">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} />
              <span>Bank-level 256-bit encryption</span>
            </div>
          </div>

          {/* Right: Stripe payment form */}
          <div className="bg-pb-surface px-6 sm:px-8 py-7 sm:py-8 flex flex-col min-h-0">
            <DialogHeader className="mb-4 sm:mb-6 text-left">
              <DialogTitle className="font-display font-bold text-[22px] tracking-[-0.025em]">
                Payment Details
              </DialogTitle>
              <DialogDescription className="text-[13px] text-pb-muted mt-1">
                Confirm registration for {selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              {clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#1F4A2E",
                        colorBackground: "#FFFFFF",
                        colorText: "#0F0F0E",
                        colorDanger: "#ef4444",
                        fontFamily: "Geist, system-ui, sans-serif",
                        borderRadius: "6px",
                      },
                    },
                  }}
                >
                  <PaymentForm
                    eventBreakdown={eventBreakdown}
                    tournamentName={tournament?.name || ""}
                    amount={cartTotal}
                    onSuccess={handlePaymentSuccess}
                    checkoutModal
                  />
                </Elements>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Partner info modal ──────────────────────────────────────────────── */}
      <Dialog open={!!partnerModalEvent} onOpenChange={(open) => { if (!open) setPartnerModalEvent(null); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[12px]">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-pb-hairline">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-[8px] bg-pb-court-tint2 border border-pb-court/20 flex items-center justify-center shrink-0">
                <UserPlus size={16} className="text-pb-court" />
              </div>
              <div>
                <DialogTitle className="font-display font-bold text-[17px] tracking-[-0.02em] text-pb-ink">
                  Partner Information
                </DialogTitle>
                <DialogDescription className="text-[11px] font-mono text-pb-muted mt-0.5">
                  {partnerModalEvent?.format === "mixed-doubles" ? "Mixed Doubles" : "Doubles"} · {partnerModalEvent?.name}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <div className="bg-pb-surface2 rounded-[8px] px-4 py-3 border border-pb-hairline">
              <p className="text-[12px] font-mono text-pb-muted leading-relaxed">
                We'll email your partner a link to register and pay their entry fee.
                Once both of you have paid, you'll be confirmed as a team.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-pb-muted">
                  Partner's Name
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Full name"
                  value={partnerFields.name}
                  onChange={(e) => setPartnerFields((p) => ({ ...p, name: e.target.value }))}
                  className="h-10 px-3 text-[13px] font-mono bg-white border border-pb-hairline rounded-[6px] text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.12em] text-pb-muted">
                  Partner's Email
                </label>
                <input
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerFields.email}
                  onChange={(e) => setPartnerFields((p) => ({ ...p, email: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter" && partnerFields.email) handlePartnerModalConfirm(); }}
                  className="h-10 px-3 text-[13px] font-mono bg-white border border-pb-hairline rounded-[6px] text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex flex-col gap-2">
            <PbBtn
              variant="primary"
              size="md"
              full
              onClick={() => handlePartnerModalConfirm(false)}
              disabled={!partnerFields.name || !partnerFields.email}
            >
              Add to cart &amp; send invite
            </PbBtn>
            <button
              onClick={() => handlePartnerModalConfirm(true)}
              className="w-full h-9 text-[12px] font-mono text-pb-muted hover:text-pb-ink transition-colors"
            >
              Skip — I'll add partner info later
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Register;
