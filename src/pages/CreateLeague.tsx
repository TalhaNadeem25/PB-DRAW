import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { leagueAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  CaretLeft,
  CaretRight,
  CalendarBlank,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const SKILL_LEVELS = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0];

const LEAGUE_TYPES = [
  {
    value: "ladder",
    label: "Ladder",
    description:
      "Players/Teams move up and down rankings each week based on stats. Each week players/teams are divided into groups based on their ranking.",
  },
  {
    value: "traditional",
    label: "Traditional League",
    description:
      "Teams (players if singles) are scheduled to play every other team in the league at least once during the session.",
  },
  {
    value: "king-of-court",
    label: "King of the Court",
    description:
      "Players are initially ranked by their rating and moved up/down courts after each game based on win/loss.",
  },
  {
    value: "dupr-session",
    label: "DUPR Session",
    description:
      "Run a King of the Court rating session and send results to DUPR.",
  },
];

const PLAYER_TYPES = [
  {
    value: "scramble",
    label: "Scramble",
    description:
      "Players sign up individually. Each week players are put into groups and partner with each of the other players in their group.",
  },
  {
    value: "partner",
    label: "Partner",
    description:
      "Players sign up with a partner and stay together for all matches throughout the session.",
  },
];

const PLAYER_GROUPS = [
  { value: "mens", label: "Mens", description: "Men Only" },
  { value: "womens", label: "Womens", description: "Women Only" },
  { value: "mixed", label: "Mixed", description: "One Male Only & One Female Only" },
  {
    value: "coed",
    label: "Coed",
    description:
      "Any Combination of Gender Can Play. NOTE: Players will enter into this bracket with their Doubles Skill",
  },
];

const RANKING_TYPES = [
  {
    value: "pop",
    label: "Percentage of Points (POP)",
    description: "% of points earned vs possible. Tie-breaker: match wins, then previous week's rank. Most fair for recreational leagues.",
  },
  {
    value: "dupr",
    label: "DUPR Rating",
    description: "DUPR's official global rating system determines rankings after each game day. Best for competitive leagues.",
  },
  {
    value: "up-down",
    label: "Up / Down",
    description: "After each game day, top players move up to a higher group and bottom players move down. Creates exciting movement.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Set your own point values for winning, losing, and playing. Full control over scoring.",
  },
];

const SIGNUP_TYPES = [
  {
    value: "open",
    label: "Each Game Day (Open League)",
    description: "Players sign up each week they want to play. Great for casual leagues where attendance varies.",
  },
  {
    value: "closed",
    label: "At Session Signup (Closed League)",
    description: "Players commit and pay for the whole season upfront. Better for competitive, structured leagues.",
  },
];

const PLAYER_PLACEMENT = [
  {
    value: "bottom",
    label: "At Bottom",
    description: "New players join at the lowest group and work their way up. Fair and standard.",
  },
  {
    value: "rating",
    label: "At Rating",
    description: "New players start at the position matching their skill rating.",
  },
];

const STEPS = [
  { label: "Basic Info" },
  { label: "League Type" },
  { label: "Settings" },
  { label: "Rules & Scoring" },
  { label: "Review" },
];

function RadioCard({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-[6px] border transition-all duration-150 focus:outline-none",
        selected
          ? "border-pb-ink bg-pb-surface2"
          : "border-pb-hairline bg-pb-surface hover:border-pb-rule"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
            selected ? "border-pb-ink bg-pb-ink" : "border-pb-hairline"
          )}
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <p className="font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-pb-ink">
            {label}
          </p>
          <p className="font-mono text-[12px] text-pb-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

const LABEL_MAP: Record<string, string> = {
  ladder: "Ladder",
  traditional: "Traditional League",
  "king-of-court": "King of the Court",
  "dupr-session": "DUPR Session",
  scramble: "Scramble",
  partner: "Partner",
  mens: "Mens",
  womens: "Womens",
  mixed: "Mixed",
  coed: "Coed",
};

export default function CreateLeague() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    address: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    registrationDeadline: undefined as Date | undefined,
    maxPlayers: 32,
    entryFee: 0,
    leagueType: "",
    playerType: "",
    playerGroup: "",
    skillLevelMin: 2.5,
    skillLevelMax: 5.0,
    allowWaitlist: false,
    contactEmail: "",
    contactPhone: "",
    rules: "",
    rankingType: "pop",
    signupType: "open",
    flexPlay: false,
    duprIntegration: false,
    newPlayerPlacement: "bottom",
    minAge: 0,
    memberFee: 0,
    nonMemberFee: 0,
  });

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const createMutation = useMutation({
    mutationFn: () =>
      leagueAPI.create({
        name: form.name,
        description: form.description,
        location: form.location,
        address: form.address,
        startDate: form.startDate?.toISOString(),
        endDate: form.endDate?.toISOString(),
        registrationDeadline: form.registrationDeadline?.toISOString(),
        maxPlayers: Number(form.maxPlayers),
        entryFee: Number(form.entryFee),
        leagueType: form.leagueType,
        playerType: form.playerType,
        playerGroup: form.playerGroup,
        skillLevel: { min: form.skillLevelMin, max: form.skillLevelMax },
        settings: { allowWaitlist: form.allowWaitlist, isPublic: true },
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        rules: form.rules,
        rankingType: form.rankingType,
        signupType: form.signupType,
        flexPlay: form.flexPlay,
        duprIntegration: form.duprIntegration,
        newPlayerPlacement: form.newPlayerPlacement,
        minAge: Number(form.minAge),
        memberFee: Number(form.memberFee),
        nonMemberFee: Number(form.nonMemberFee),
      }),
    onSuccess: (data) => {
      toast({ title: "League created!", description: "Your league is now live." });
      navigate(`/leagues/${data.data._id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.response?.data?.message ?? "Failed to create league.",
        variant: "destructive",
      });
    },
  });

  const canNext = () => {
    if (step === 0) return form.name.trim() !== "" && form.location.trim() !== "";
    if (step === 1) return form.leagueType !== "" && form.playerType !== "" && form.playerGroup !== "";
    if (step === 3) return form.rankingType !== "" && form.signupType !== "";
    return true;
  };

  const fieldLabel = "font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-1.5 block";
  const selectCls = "w-full h-10 rounded-[6px] border border-pb-hairline bg-pb-surface font-mono text-[13px] px-3 text-pb-ink focus:outline-none focus:ring-1 focus:ring-pb-court";

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="font-display font-extrabold text-[36px] tracking-[-0.04em] text-pb-ink leading-none">
              Create League
            </h1>
            <p className="font-mono text-[13px] text-pb-muted mt-2">Fill in the details to launch your pickleball league.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all",
                      active
                        ? "bg-pb-ink border-pb-ink text-white"
                        : done
                        ? "bg-pb-ink/20 border-pb-ink/30 text-pb-ink"
                        : "bg-pb-surface border-pb-hairline text-pb-muted"
                    )}
                  >
                    {done ? (
                      <Check className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <span className="font-mono text-[12px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[11px] uppercase tracking-[0.06em] ml-1.5 hidden sm:inline",
                      active ? "text-pb-ink" : "text-pb-muted"
                    )}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "h-px flex-1 mx-2 transition-colors",
                        i < step ? "bg-pb-ink/30" : "bg-pb-hairline"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div className="bg-pb-surface border border-pb-hairline rounded-[8px] p-6 sm:p-8">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className={fieldLabel}>
                      League Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Tuesday Night Ladder"
                    />
                  </div>
                  <div>
                    <Label className={fieldLabel}>
                      Description
                    </Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Describe your league..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className={fieldLabel}>
                        Location / Venue <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.location}
                        onChange={(e) => set("location", e.target.value)}
                        placeholder="Recreation Center"
                      />
                    </div>
                    <div>
                      <Label className={fieldLabel}>
                        Address
                      </Label>
                      <Input
                        value={form.address}
                        onChange={(e) => set("address", e.target.value)}
                        placeholder="123 Main St, City, State"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className={fieldLabel}>
                        Start Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-full h-10 border border-pb-hairline rounded-[6px] bg-pb-surface font-mono text-[13px] px-3 text-left flex items-center gap-2 hover:border-pb-rule transition-colors",
                              !form.startDate && "text-pb-muted"
                            )}
                          >
                            <CalendarBlank className="w-4 h-4 shrink-0" />
                            {form.startDate ? format(form.startDate, "MMM d, yyyy") : "Pick a date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.startDate}
                            onSelect={(d) => set("startDate", d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className={fieldLabel}>
                        End Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-full h-10 border border-pb-hairline rounded-[6px] bg-pb-surface font-mono text-[13px] px-3 text-left flex items-center gap-2 hover:border-pb-rule transition-colors",
                              !form.endDate && "text-pb-muted"
                            )}
                          >
                            <CalendarBlank className="w-4 h-4 shrink-0" />
                            {form.endDate ? format(form.endDate, "MMM d, yyyy") : "Pick a date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.endDate}
                            onSelect={(d) => set("endDate", d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className={fieldLabel}>
                        Reg. Deadline
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-full h-10 border border-pb-hairline rounded-[6px] bg-pb-surface font-mono text-[13px] px-3 text-left flex items-center gap-2 hover:border-pb-rule transition-colors",
                              !form.registrationDeadline && "text-pb-muted"
                            )}
                          >
                            <CalendarBlank className="w-4 h-4 shrink-0" />
                            {form.registrationDeadline ? format(form.registrationDeadline, "MMM d, yyyy") : "Pick a date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={form.registrationDeadline}
                            onSelect={(d) => set("registrationDeadline", d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={fieldLabel}>
                        Max Players
                      </Label>
                      <Input
                        type="number"
                        min={4}
                        value={form.maxPlayers}
                        onChange={(e) => set("maxPlayers", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className={fieldLabel}>
                        Entry Fee ($)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.entryFee}
                        onChange={(e) => set("entryFee", Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: League Type */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
                  League Type
                </h2>

                <div>
                  <label className={cn(fieldLabel, "mb-3")}>
                    League Format <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {LEAGUE_TYPES.map((t) => (
                      <RadioCard
                        key={t.value}
                        selected={form.leagueType === t.value}
                        onClick={() => set("leagueType", t.value)}
                        label={t.label}
                        description={t.description}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={cn(fieldLabel, "mb-3")}>
                    Player Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLAYER_TYPES.map((t) => (
                      <RadioCard
                        key={t.value}
                        selected={form.playerType === t.value}
                        onClick={() => set("playerType", t.value)}
                        label={t.label}
                        description={t.description}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={cn(fieldLabel, "mb-3")}>
                    Player Group <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLAYER_GROUPS.map((g) => (
                      <RadioCard
                        key={g.value}
                        selected={form.playerGroup === g.value}
                        onClick={() => set("playerGroup", g.value)}
                        label={g.label}
                        description={g.description}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Settings */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
                  Venue & Settings
                </h2>

                <div>
                  <label className={fieldLabel}>Skill Level Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-[11px] text-pb-muted mb-1 block">Min</label>
                      <select
                        value={form.skillLevelMin}
                        onChange={(e) => set("skillLevelMin", Number(e.target.value))}
                        className={selectCls}
                      >
                        {SKILL_LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-mono text-[11px] text-pb-muted mb-1 block">Max</label>
                      <select
                        value={form.skillLevelMax}
                        onChange={(e) => set("skillLevelMax", Number(e.target.value))}
                        className={selectCls}
                      >
                        {SKILL_LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-[6px] border border-pb-hairline bg-pb-surface">
                  <div>
                    <p className="font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-pb-ink">
                      Allow Waitlist
                    </p>
                    <p className="font-mono text-[12px] text-pb-muted mt-0.5">
                      Players can join a waitlist when the league is full
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set("allowWaitlist", !form.allowWaitlist)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                      form.allowWaitlist ? "bg-pb-court" : "bg-pb-hairline"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                        form.allowWaitlist ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className={fieldLabel}>Contact Email</Label>
                    <Input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => set("contactEmail", e.target.value)}
                      placeholder="organizer@example.com"
                    />
                  </div>
                  <div>
                    <Label className={fieldLabel}>Contact Phone</Label>
                    <Input
                      value={form.contactPhone}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <Label className={fieldLabel}>Rules</Label>
                  <Textarea
                    value={form.rules}
                    onChange={(e) => set("rules", e.target.value)}
                    placeholder="League rules and important info..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Rules & Scoring */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
                  Rules & Scoring
                </h2>

                <div>
                  <label className={cn(fieldLabel, "mb-3")}>
                    Ranking Type <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {RANKING_TYPES.map((t) => (
                      <RadioCard
                        key={t.value}
                        selected={form.rankingType === t.value}
                        onClick={() => set("rankingType", t.value)}
                        label={t.label}
                        description={t.description}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={cn(fieldLabel, "mb-3")}>
                    Signup / Payment Type <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {SIGNUP_TYPES.map((t) => (
                      <RadioCard
                        key={t.value}
                        selected={form.signupType === t.value}
                        onClick={() => set("signupType", t.value)}
                        label={t.label}
                        description={t.description}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className={cn(fieldLabel, "mb-3")}>New Players Start</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLAYER_PLACEMENT.map((p) => (
                      <RadioCard
                        key={p.value}
                        selected={form.newPlayerPlacement === p.value}
                        onClick={() => set("newPlayerPlacement", p.value)}
                        label={p.label}
                        description={p.description}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "flexPlay", label: "Flex Play", desc: "Players arrange their own game times. No fixed schedule." },
                    { key: "duprIntegration", label: "Count Games Toward DUPR Ratings", desc: "Game results are submitted to DUPR for official ratings." },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-[6px] border border-pb-hairline bg-pb-surface">
                      <div>
                        <p className="font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-pb-ink">{label}</p>
                        <p className="font-mono text-[12px] text-pb-muted mt-0.5">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => set(key, !(form as any)[key])}
                        className={cn(
                          "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0",
                          (form as any)[key] ? "bg-pb-court" : "bg-pb-hairline"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                          (form as any)[key] ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className={fieldLabel}>Min Age</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.minAge}
                      onChange={(e) => set("minAge", Number(e.target.value))}
                      placeholder="0 = any age"
                    />
                  </div>
                  <div>
                    <Label className={fieldLabel}>Cost to Members ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.memberFee}
                      onChange={(e) => set("memberFee", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className={fieldLabel}>Cost to Non-Members ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.nonMemberFee}
                      onChange={(e) => set("nonMemberFee", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-display font-bold text-[22px] tracking-[-0.03em] text-pb-ink">
                  Review & Create
                </h2>
                <p className="font-mono text-[13px] text-pb-muted">
                  Confirm your league details before publishing.
                </p>

                <div className="space-y-0 divide-y divide-pb-hairline">
                  {[
                    { label: "League Name", value: form.name },
                    { label: "Location", value: form.location },
                    { label: "Address", value: form.address || "—" },
                    {
                      label: "Dates",
                      value:
                        form.startDate || form.endDate
                          ? [
                              form.startDate ? format(form.startDate, "MMM d, yyyy") : null,
                              form.endDate ? format(form.endDate, "MMM d, yyyy") : null,
                            ]
                              .filter(Boolean)
                              .join(" → ")
                          : "—",
                    },
                    {
                      label: "Registration Deadline",
                      value: form.registrationDeadline
                        ? format(form.registrationDeadline, "MMM d, yyyy")
                        : "—",
                    },
                    { label: "Max Players", value: String(form.maxPlayers) },
                    {
                      label: "Entry Fee",
                      value: form.entryFee === 0 ? "Free" : `$${form.entryFee}`,
                    },
                    {
                      label: "League Type",
                      value: LABEL_MAP[form.leagueType] || form.leagueType || "—",
                    },
                    {
                      label: "Player Type",
                      value: LABEL_MAP[form.playerType] || form.playerType || "—",
                    },
                    {
                      label: "Player Group",
                      value: LABEL_MAP[form.playerGroup] || form.playerGroup || "—",
                    },
                    {
                      label: "Skill Level",
                      value: `${form.skillLevelMin} – ${form.skillLevelMax}`,
                    },
                    {
                      label: "Waitlist",
                      value: form.allowWaitlist ? "Enabled" : "Disabled",
                    },
                    { label: "Contact Email", value: form.contactEmail || "—" },
                    {
                      label: "Ranking Type",
                      value: RANKING_TYPES.find(r => r.value === form.rankingType)?.label || form.rankingType,
                    },
                    {
                      label: "Signup Type",
                      value: SIGNUP_TYPES.find(s => s.value === form.signupType)?.label || form.signupType,
                    },
                    {
                      label: "New Players Start",
                      value: form.newPlayerPlacement === "bottom" ? "At Bottom" : "At Rating",
                    },
                    { label: "Flex Play", value: form.flexPlay ? "Yes" : "No" },
                    { label: "DUPR Integration", value: form.duprIntegration ? "Yes" : "No" },
                    { label: "Min Age", value: form.minAge > 0 ? String(form.minAge) : "Any" },
                    {
                      label: "Member / Non-Member Fee",
                      value: `$${form.memberFee} / $${form.nonMemberFee}`,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-start justify-between gap-4 py-3"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted shrink-0">
                        {label}
                      </span>
                      <span className="font-mono text-[13px] text-pb-ink text-right">{value}</span>
                    </div>
                  ))}
                </div>

                {form.description && (
                  <div className="p-4 rounded-[6px] bg-pb-surface2 border border-pb-hairline">
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted mb-1">
                      Description
                    </p>
                    <p className="font-mono text-[13px] text-pb-ink">{form.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-pb-hairline">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 border border-pb-hairline rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-pb-ink h-10 px-4 hover:bg-pb-surface2 transition-colors disabled:opacity-40"
              >
                <CaretLeft className="w-4 h-4" />
                Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className="inline-flex items-center gap-1.5 bg-pb-ink text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-5 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Next
                  <CaretRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 bg-pb-ink text-white rounded-[6px] font-mono text-[12px] uppercase tracking-[0.06em] h-10 px-5 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {createMutation.isPending ? "Creating..." : "Create League"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
