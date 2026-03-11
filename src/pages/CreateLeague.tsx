import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { leagueAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  CaretLeft,
  CaretRight,
  Trophy,
  MapPin,
  Users,
  Gear,
  ClipboardText,
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

const STEPS = [
  { label: "Basic Info", icon: ClipboardText },
  { label: "League Type", icon: Trophy },
  { label: "Settings", icon: Gear },
  { label: "Review", icon: Check },
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
        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
        selected
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-border/50 bg-card/60 hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
            selected ? "border-primary bg-primary" : "border-border"
          )}
        >
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <p className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
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
    startDate: "",
    endDate: "",
    registrationDeadline: "",
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
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        registrationDeadline: form.registrationDeadline || undefined,
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
    return true;
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-foreground">
            CREATE LEAGUE
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Fill in the details to launch your pickleball league.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 shrink-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : done
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-xs font-display font-bold uppercase tracking-wide hidden sm:inline">
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-1 transition-colors",
                      i < step ? "bg-primary/50" : "bg-border/50"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-border/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 0: Basic Info */}
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="font-display font-black text-xl uppercase tracking-tight text-foreground">
                    Basic Information
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                        League Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="e.g. Tuesday Night Ladder"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                        Description
                      </Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Describe your league..."
                        rows={3}
                        className="rounded-xl resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                          Location / Venue <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={form.location}
                          onChange={(e) => set("location", e.target.value)}
                          placeholder="Recreation Center"
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                          Address
                        </Label>
                        <Input
                          value={form.address}
                          onChange={(e) => set("address", e.target.value)}
                          placeholder="123 Main St, City, State"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                          Start Date
                        </Label>
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => set("startDate", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                          End Date
                        </Label>
                        <Input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => set("endDate", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                          Reg. Deadline
                        </Label>
                        <Input
                          type="date"
                          value={form.registrationDeadline}
                          onChange={(e) => set("registrationDeadline", e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                          Max Players
                        </Label>
                        <Input
                          type="number"
                          min={4}
                          value={form.maxPlayers}
                          onChange={(e) => set("maxPlayers", Number(e.target.value))}
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
                          value={form.entryFee}
                          onChange={(e) => set("entryFee", Number(e.target.value))}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: League Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="font-display font-black text-xl uppercase tracking-tight text-foreground">
                    League Type
                  </h2>

                  <div>
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-3 block text-muted-foreground">
                      League Format <span className="text-destructive">*</span>
                    </Label>
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
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-3 block text-muted-foreground">
                      Player Type <span className="text-destructive">*</span>
                    </Label>
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
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-3 block text-muted-foreground">
                      Player Group <span className="text-destructive">*</span>
                    </Label>
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
                  <h2 className="font-display font-black text-xl uppercase tracking-tight text-foreground">
                    Venue & Settings
                  </h2>

                  <div>
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-2 block">
                      Skill Level Range
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Min</Label>
                        <select
                          value={form.skillLevelMin}
                          onChange={(e) => set("skillLevelMin", Number(e.target.value))}
                          className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {SKILL_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Max</Label>
                        <select
                          value={form.skillLevelMax}
                          onChange={(e) => set("skillLevelMax", Number(e.target.value))}
                          className="w-full h-10 rounded-xl border border-border/50 bg-card/60 text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {SKILL_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/60">
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
                      onClick={() => set("allowWaitlist", !form.allowWaitlist)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        form.allowWaitlist ? "bg-primary" : "bg-muted"
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
                      <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                        Contact Email
                      </Label>
                      <Input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => set("contactEmail", e.target.value)}
                        placeholder="organizer@example.com"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                        Contact Phone
                      </Label>
                      <Input
                        value={form.contactPhone}
                        onChange={(e) => set("contactPhone", e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-display font-bold text-xs uppercase tracking-wide mb-1.5 block">
                      Rules
                    </Label>
                    <Textarea
                      value={form.rules}
                      onChange={(e) => set("rules", e.target.value)}
                      placeholder="League rules and important info..."
                      rows={4}
                      className="rounded-xl resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-display font-black text-xl uppercase tracking-tight text-foreground">
                    Review & Create
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Confirm your league details before publishing.
                  </p>

                  <div className="space-y-3">
                    {[
                      { label: "League Name", value: form.name },
                      { label: "Location", value: form.location },
                      { label: "Address", value: form.address || "—" },
                      {
                        label: "Dates",
                        value: [form.startDate, form.endDate].filter(Boolean).join(" → ") || "—",
                      },
                      {
                        label: "Registration Deadline",
                        value: form.registrationDeadline || "—",
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
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-4 py-3 border-b border-border/30 last:border-0"
                      >
                        <span className="text-xs font-display font-bold uppercase tracking-wide text-muted-foreground shrink-0">
                          {label}
                        </span>
                        <span className="text-sm font-medium text-foreground text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {form.description && (
                    <div className="p-4 rounded-xl bg-accent/30 border border-border/40">
                      <p className="text-xs font-display font-bold uppercase tracking-wide text-muted-foreground mb-1">
                        Description
                      </p>
                      <p className="text-sm text-foreground">{form.description}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/40">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="font-display font-bold uppercase tracking-wide text-xs"
            >
              <CaretLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="font-display font-black uppercase tracking-wide shadow-md hover:shadow-glow transition-all"
              >
                Next
                <CaretRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="font-display font-black uppercase tracking-wide shadow-md hover:shadow-glow transition-all"
              >
                {createMutation.isPending ? "Creating..." : "Create League"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
