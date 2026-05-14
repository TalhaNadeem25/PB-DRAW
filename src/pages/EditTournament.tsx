import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Eyebrow, PbBtn } from "@/components/ui/pb";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarBlank, ArrowLeft, CircleNotch, FloppyDisk,
  Users, Trophy, MapPin, Gavel, CurrencyDollar, Check,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { tournamentAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const AMENITY_OPTIONS = ["Parking", "Restrooms", "Locker Rooms", "Food & Beverages", "Seating/Bleachers", "First Aid", "WiFi"];

/* ── Shared form primitives ── */
const FL = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-mono uppercase tracking-[0.08em] text-pb-muted mb-1.5">{children}</label>
);
const FI = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule",
      props.className
    )}
  />
);
const FS = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      "w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule",
      props.className
    )}
  />
);
const FTA = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 py-2 text-[13px] font-sans text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule resize-none",
      props.className
    )}
  />
);

/* ── Section card ── */
const SCard = ({ icon: Icon, title, sub, children }: { icon: React.ElementType; title: string; sub?: string; children: React.ReactNode }) => (
  <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-pb-hairline bg-pb-surface2">
      <Icon size={14} className="text-pb-muted shrink-0" />
      <div>
        <p className="font-display font-semibold text-[15px] tracking-[-0.015em] text-pb-ink">{title}</p>
        {sub && <p className="text-[11px] font-mono text-pb-muted">{sub}</p>}
      </div>
    </div>
    <div className="p-5 space-y-5">{children}</div>
  </div>
);

/* ── Date picker trigger ── */
const DateBtn = ({ date, onClick }: { date?: Date; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-9 rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[13px] font-mono text-pb-ink flex items-center gap-2 hover:border-pb-rule focus:outline-none focus:border-pb-rule transition-colors"
  >
    <CalendarBlank size={13} className="text-pb-muted shrink-0" />
    {date ? format(date, "MMM d, yyyy") : <span className="text-pb-faint">Pick a date</span>}
  </button>
);

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const tournament = data?.data;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(128);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [status, setStatus] = useState("open");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [allowWaitlist, setAllowWaitlist] = useState(false);

  const [courtCount, setCourtCount] = useState<number | string>("");
  const [courtSurface, setCourtSurface] = useState("");
  const [playStartTime, setPlayStartTime] = useState("08:00");
  const [playEndTime, setPlayEndTime] = useState("18:00");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [spectatorCapacity, setSpectatorCapacity] = useState<number | string>("");

  const [checkInWindow, setCheckInWindow] = useState("30");
  const [refereeType, setRefereeType] = useState("");
  const [entryFee, setEntryFee] = useState<number | string>(0);
  const [prizeTotal, setPrizeTotal] = useState<number | string>("");
  const [prizeFirst, setPrizeFirst] = useState("");
  const [prizeSecond, setPrizeSecond] = useState("");
  const [prizeThird, setPrizeThird] = useState("");
  const [rules, setRules] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (tournament) {
      setName(tournament.name || "");
      setLocation(tournament.location || "");
      setAddress(tournament.address || "");
      setDescription(tournament.description || "");
      setMaxPlayers(tournament.maxPlayers || 128);
      setStartDate(tournament.startDate ? new Date(tournament.startDate) : undefined);
      setEndDate(tournament.endDate ? new Date(tournament.endDate) : undefined);
      setRegistrationDeadline(tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : undefined);
      setStatus(tournament.status || "open");
      setCurrentImage(tournament.image || null);
      setAllowWaitlist(tournament.settings?.allowWaitlist === true);
      setCourtCount(tournament.venue?.courts ?? "");
      setCourtSurface(tournament.venue?.courtSurface || "");
      setAmenities(tournament.venue?.facilities || []);
      setSpectatorCapacity(tournament.venue?.spectatorCapacity ?? "");
      setPlayStartTime(tournament.scheduling?.startTime || "08:00");
      setPlayEndTime(tournament.scheduling?.endTime || "18:00");
      setCheckInWindow(String(tournament.scheduling?.checkInWindow ?? 30));
      setRefereeType(tournament.refereeType || "");
      setEntryFee(tournament.entryFee ?? 0);
      setPrizeTotal(tournament.prizePool?.total ?? "");
      setPrizeFirst(tournament.prizePool?.distribution?.first || "");
      setPrizeSecond(tournament.prizePool?.distribution?.second || "");
      setPrizeThird(tournament.prizePool?.distribution?.third || "");
      setRules(tournament.rules || "");
      setContactEmail(tournament.contactEmail || "");
      setContactPhone(tournament.contactPhone || "");
    }
  }, [tournament]);

  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG, and WEBP images are allowed"); return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => tournamentAPI.update(id!, data),
    onSuccess: async () => {
      if (imageFile) {
        try { await tournamentAPI.uploadImage(id!, imageFile); }
        catch { toast.error("Tournament updated but image upload failed"); }
      }
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament updated successfully!");
      navigate(`/tournaments/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update tournament");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateMutation.mutate({
      name, description, location, address,
      startDate: startDate.toISOString(), endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline?.toISOString(),
      maxPlayers, status,
      rules: rules || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      entryFee: Number(entryFee) || 0,
      refereeType: refereeType || undefined,
      settings: { ...(tournament?.settings || {}), allowWaitlist },
      venue: {
        courts: courtCount !== "" ? Number(courtCount) : undefined,
        courtSurface: courtSurface || undefined,
        facilities: amenities.length > 0 ? amenities : undefined,
        spectatorCapacity: spectatorCapacity !== "" ? Number(spectatorCapacity) : undefined,
      },
      scheduling: { startTime: playStartTime, endTime: playEndTime, checkInWindow: Number(checkInWindow) },
      prizePool: {
        total: prizeTotal !== "" ? Number(prizeTotal) : 0,
        distribution: { first: prizeFirst || undefined, second: prizeSecond || undefined, third: prizeThird || undefined },
      },
    });
  };

  const isOrganizer = tournament && user && (
    tournament.organizerId === user._id ||
    tournament.organizer?._id === user._id ||
    user.role === "admin"
  );

  /* ── Loading / error / auth states ── */
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-pb-paper flex items-center justify-center">
          <CircleNotch size={24} className="animate-spin text-pb-muted" />
        </div>
      </Layout>
    );
  }

  if (error || !tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-pb-paper flex items-center justify-center px-4">
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-8 max-w-md w-full text-center">
            <p className="font-display font-bold text-[18px] text-pb-ink mb-2">Tournament Not Found</p>
            <p className="text-[12px] font-mono text-pb-muted mb-5">The tournament you're looking for doesn't exist.</p>
            <a href="/tournaments" className="font-mono text-[12px] text-pb-court underline underline-offset-2">
              Back to Tournaments
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (tournament && user && !isOrganizer) {
    return (
      <Layout>
        <div className="min-h-screen bg-pb-paper flex items-center justify-center px-4">
          <div className="bg-pb-surface border border-pb-hairline rounded-[6px] p-8 max-w-md w-full text-center">
            <p className="font-display font-bold text-[18px] text-pb-ink mb-2">Unauthorized</p>
            <p className="text-[12px] font-mono text-pb-muted mb-5">You don't have permission to edit this tournament.</p>
            <a href={`/tournaments/${id}`} className="font-mono text-[12px] text-pb-court underline underline-offset-2">
              Back to Tournament
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-pb-paper">

        {/* ── Top bar ── */}
        <div className="bg-pb-surface border-b border-pb-hairline">
          <div className="container mx-auto px-4 sm:px-6 py-5">
            <button
              onClick={() => navigate(`/tournaments/${id}`)}
              className="inline-flex items-center gap-1.5 text-[12px] font-mono text-pb-muted hover:text-pb-ink mb-4 transition-colors"
            >
              <ArrowLeft size={13} /> Back to Tournament
            </button>
            <h1 className="font-display font-extrabold text-[32px] tracking-[-0.035em] leading-none text-pb-ink mb-1">
              Edit Tournament
            </h1>
            <p className="text-[12px] font-mono text-pb-muted">Update tournament information</p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── Basic Info ── */}
              <SCard icon={Trophy} title="Tournament Details" sub="Update the basic information about your tournament">
                <div>
                  <FL>Tournament Name *</FL>
                  <FI value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FL>Venue Name *</FL>
                    <FI value={location} onChange={(e) => setLocation(e.target.value)} required />
                  </div>
                  <div>
                    <FL>Address</FL>
                    <FI value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
                <div>
                  <FL>Description</FL>
                  <FTA value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FL>Max Players *</FL>
                    <FI
                      type="number"
                      min={4}
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 128)}
                      required
                    />
                  </div>
                  <div>
                    <FL>Status</FL>
                    <FS value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </FS>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FL>Contact Email</FL>
                    <FI type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div>
                    <FL>Contact Phone</FL>
                    <FI type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 p-4 rounded-[6px] border border-pb-hairline bg-pb-surface2">
                  <div className="flex items-start gap-2.5">
                    <Users size={14} className="text-pb-muted shrink-0 mt-0.5" />
                    <div>
                      <p className="font-sans font-medium text-[13px] text-pb-ink">Allow waitlist</p>
                      <p className="text-[11px] font-mono text-pb-muted mt-0.5">
                        When an event is full, players can join a waitlist. You can approve them to send a payment link.
                      </p>
                    </div>
                  </div>
                  <Switch checked={allowWaitlist} onCheckedChange={setAllowWaitlist} className="shrink-0" />
                </div>
                <div>
                  <FL>Tournament Image</FL>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="w-full text-[12px] font-mono text-pb-muted file:mr-3 file:h-7 file:px-3 file:rounded-[4px] file:border file:border-pb-hairline file:bg-pb-surface2 file:text-[11px] file:font-mono file:text-pb-ink file:cursor-pointer"
                  />
                  <p className="text-[11px] font-mono text-pb-faint mt-1.5">JPEG, PNG, or WEBP · max 5 MB</p>
                  {(imagePreview || currentImage) && (
                    <div className="mt-3">
                      <img
                        src={imagePreview || currentImage!}
                        alt="Tournament"
                        className="w-full max-w-sm rounded-[6px] border border-pb-hairline object-cover"
                      />
                      {imagePreview && (
                        <p className="text-[11px] font-mono text-pb-muted mt-1.5">New image selected — will be uploaded on save</p>
                      )}
                    </div>
                  )}
                </div>
              </SCard>

              {/* ── Dates ── */}
              <SCard icon={CalendarBlank} title="Dates" sub="Update tournament dates and registration deadline">
                <div className="grid md:grid-cols-3 gap-4">
                  {([
                    { label: "Start Date *", date: startDate, set: setStartDate },
                    { label: "End Date *", date: endDate, set: setEndDate },
                    { label: "Registration Deadline", date: registrationDeadline, set: setRegistrationDeadline },
                  ] as { label: string; date: Date | undefined; set: (d: Date | undefined) => void }[]).map(({ label, date, set }) => (
                    <div key={label}>
                      <FL>{label}</FL>
                      <Popover>
                        <PopoverTrigger asChild>
                          <DateBtn date={date} />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={date} onSelect={set} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              </SCard>

              {/* ── Venue ── */}
              <SCard icon={MapPin} title="Venue & Courts" sub="Tell players about your venue setup">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FL>Number of Courts</FL>
                    <FI
                      type="number"
                      min={1}
                      placeholder="e.g. 8"
                      value={courtCount}
                      onChange={(e) => setCourtCount(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <FL>Court Surface</FL>
                    <FS value={courtSurface} onChange={(e) => setCourtSurface(e.target.value)}>
                      <option value="">Select surface type</option>
                      <option value="indoor-sport-court">Indoor Sport Court</option>
                      <option value="indoor-wood">Indoor Wood</option>
                      <option value="outdoor-concrete">Outdoor Concrete</option>
                      <option value="outdoor-asphalt">Outdoor Asphalt</option>
                      <option value="outdoor-sport-court">Outdoor Sport Court</option>
                    </FS>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FL>Play Starts</FL>
                    <FI type="time" value={playStartTime} onChange={(e) => setPlayStartTime(e.target.value)} />
                  </div>
                  <div>
                    <FL>Play Ends</FL>
                    <FI type="time" value={playEndTime} onChange={(e) => setPlayEndTime(e.target.value)} />
                  </div>
                  <div>
                    <FL>Spectator Capacity</FL>
                    <FI
                      type="number"
                      min={0}
                      placeholder="e.g. 200"
                      value={spectatorCapacity}
                      onChange={(e) => setSpectatorCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <FL>Amenities</FL>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                    {AMENITY_OPTIONS.map((amenity) => (
                      <label
                        key={amenity}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer p-2.5 rounded-[6px] border transition-colors",
                          amenities.includes(amenity)
                            ? "border-pb-court bg-pb-court-tint2"
                            : "border-pb-hairline bg-pb-surface2 hover:border-pb-rule"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors",
                          amenities.includes(amenity) ? "bg-pb-court border-pb-court" : "border-pb-rule bg-pb-surface"
                        )}>
                          {amenities.includes(amenity) && <Check size={10} weight="bold" className="text-white" />}
                        </div>
                        <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="sr-only" />
                        <span className="text-[11px] font-mono text-pb-ink">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </SCard>

              {/* ── Rules & Prizes ── */}
              <SCard icon={Gavel} title="Rules & Prizes" sub="Configure rules, fees, and prize distribution">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <FL>Check-In Window (min)</FL>
                    <FI
                      type="number"
                      min={0}
                      placeholder="30"
                      value={checkInWindow}
                      onChange={(e) => setCheckInWindow(e.target.value)}
                    />
                    <p className="text-[11px] font-mono text-pb-faint mt-1">Minutes before first match</p>
                  </div>
                  <div>
                    <FL>Referee Type</FL>
                    <FS value={refereeType} onChange={(e) => setRefereeType(e.target.value)}>
                      <option value="">Select referee type</option>
                      <option value="self-officiated">Self-officiated</option>
                      <option value="line-judges">Line Judges</option>
                      <option value="certified-referees">Certified Referees</option>
                    </FS>
                  </div>
                  <div>
                    <FL>Tournament Entry Fee ($)</FL>
                    <div className="relative">
                      <CurrencyDollar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" />
                      <FI
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0"
                        value={entryFee}
                        onChange={(e) => setEntryFee(e.target.value === "" ? "" : Number(e.target.value))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-pb-hairline">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy size={13} className="text-pb-muted shrink-0" />
                    <Eyebrow>Prize Pool</Eyebrow>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <FL>Total ($)</FL>
                      <FI
                        type="number"
                        min={0}
                        placeholder="0"
                        value={prizeTotal}
                        onChange={(e) => setPrizeTotal(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </div>
                    {[
                      { label: "🥇 1st Place", value: prizeFirst, set: setPrizeFirst },
                      { label: "🥈 2nd Place", value: prizeSecond, set: setPrizeSecond },
                      { label: "🥉 3rd Place", value: prizeThird, set: setPrizeThird },
                    ].map(({ label, value, set }) => (
                      <div key={label}>
                        <FL>{label}</FL>
                        <FI placeholder="e.g. $500" value={value} onChange={(e) => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <FL>Tournament Rules</FL>
                  <FTA
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    rows={5}
                    placeholder="Describe the rules, scoring format, and any special regulations..."
                    maxLength={2000}
                  />
                  <p className="text-[11px] font-mono text-pb-faint mt-1 text-right">{rules.length}/2000</p>
                </div>
              </SCard>

              {/* ── Footer actions ── */}
              <div className="flex justify-end gap-3 pb-8">
                <PbBtn type="button" variant="outline" size="md" onClick={() => navigate(`/tournaments/${id}`)}>
                  Cancel
                </PbBtn>
                <PbBtn type="submit" variant="primary" size="md" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <><CircleNotch size={14} className="animate-spin" /> Saving…</>
                  ) : (
                    <><FloppyDisk size={14} /> Save Changes</>
                  )}
                </PbBtn>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditTournament;
