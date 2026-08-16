import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { clubAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const JOIN_TYPES = [
  {
    value: "open",
    label: "Open",
    description: "Anyone can join instantly — no approval needed.",
  },
  {
    value: "request",
    label: "Request to Join",
    description: "People can ask to join, but you (or another admin) approve each request.",
  },
  {
    value: "invite-only",
    label: "Invite Only",
    description: "Nobody can self-join. You add members directly from the club's Manage page.",
  },
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

export default function CreateClub() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    address: "",
    joinType: "open",
    isPublic: true,
    maxMembers: 0,
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const createMutation = useMutation({
    mutationFn: () =>
      clubAPI.create({
        name: form.name,
        description: form.description,
        location: form.location,
        address: form.address,
        joinType: form.joinType,
        settings: {
          isPublic: form.isPublic,
          maxMembers: Number(form.maxMembers) || 0,
        },
      }),
    onSuccess: (data) => {
      toast({ title: "Club created!", description: "Your club is now live." });
      navigate(`/clubs/${data.data._id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't create club",
        description: err?.response?.data?.message || "Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const canSubmit = form.name.trim().length > 0 && form.location.trim().length > 0;

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper pt-24 pb-16">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="font-display font-extrabold text-[36px] tracking-[-0.04em] text-pb-ink leading-none mb-2">
              Create a Club
            </h1>
            <p className="font-mono text-[13px] text-pb-muted">
              Start a standing group for recurring play — members can RSVP to games you schedule.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) createMutation.mutate();
            }}
            className="space-y-8"
          >
            {/* Basic Info */}
            <section className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                Basic Info
              </h2>

              <div className="space-y-1.5">
                <Label className="font-mono text-[12px] text-pb-ink">Club Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Riverside Pickleball Club"
                  className="bg-pb-paper border-pb-hairline font-mono text-[13px]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[12px] text-pb-ink">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What's this club about? Who should join?"
                  className="bg-pb-paper border-pb-hairline font-mono text-[13px] min-h-[90px]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[12px] text-pb-ink">Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="Austin, TX"
                    className="bg-pb-paper border-pb-hairline font-mono text-[13px]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[12px] text-pb-ink">Address (optional)</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="123 Riverside Dr"
                    className="bg-pb-paper border-pb-hairline font-mono text-[13px]"
                  />
                </div>
              </div>
            </section>

            {/* Join Type */}
            <section className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-4">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                Who Can Join
              </h2>
              <div className="space-y-3">
                {JOIN_TYPES.map((jt) => (
                  <RadioCard
                    key={jt.value}
                    selected={form.joinType === jt.value}
                    onClick={() => set("joinType", jt.value)}
                    label={jt.label}
                    description={jt.description}
                  />
                ))}
              </div>
            </section>

            {/* Settings */}
            <section className="bg-pb-surface border border-pb-hairline rounded-[8px] p-5 space-y-5">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.08em] text-pb-muted">
                Settings
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[13px] text-pb-ink">Public club</p>
                  <p className="font-mono text-[12px] text-pb-muted">
                    Show this club in the public browse list
                  </p>
                </div>
                <Switch
                  checked={form.isPublic}
                  onCheckedChange={(checked) => set("isPublic", checked)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-mono text-[12px] text-pb-ink">Max Members</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxMembers}
                  onChange={(e) => set("maxMembers", e.target.value)}
                  placeholder="0"
                  className="bg-pb-paper border-pb-hairline font-mono text-[13px] max-w-[160px]"
                />
                <p className="font-mono text-[11px] text-pb-muted">Leave at 0 for unlimited members</p>
              </div>
            </section>

            <button
              type="submit"
              disabled={!canSubmit || createMutation.isPending}
              className="w-full bg-pb-court text-white rounded-[6px] font-mono text-[13px] uppercase tracking-[0.06em] py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Club"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
