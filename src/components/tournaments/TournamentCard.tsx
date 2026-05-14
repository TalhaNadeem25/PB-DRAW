import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Trophy, Users } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eyebrow, Pill, PbBtn, Dot } from "@/components/ui/pb";
import { ArrowRight } from "@phosphor-icons/react";

interface TournamentCardProps {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  playerCount: number;
  maxPlayers: number;
  eventCount: number;
  status: "open" | "closed" | "in-progress" | "completed";
  featured?: boolean;
  entryFee?: number;
  skillLevel?: string;
  imageUrl?: string;
  organizerId?: string;
  registrationDeadline?: string;
}

const TournamentCard = ({
  id,
  name,
  location,
  startDate,
  endDate,
  playerCount,
  maxPlayers,
  eventCount,
  status,
  entryFee,
  skillLevel,
  imageUrl,
  organizerId,
  registrationDeadline,
}: TournamentCardProps) => {
  const { user } = useAuth();
  const isOwner = user?._id === organizerId || user?.role === "admin";
  const isLive = status === "in-progress";

  const locationParts = location?.split(",") || [];
  const shortLocation =
    locationParts.length >= 2
      ? `${locationParts[0].trim()}, ${locationParts[locationParts.length - 1].trim()}`
      : location;

  const spotsTotal = maxPlayers || 100;
  const spotsFilled = playerCount || 0;
  const spotsRemaining = Math.max(0, spotsTotal - spotsFilled);
  const fillPercent = Math.min(100, (spotsFilled / spotsTotal) * 100);
  const isFillingFast = spotsRemaining > 0 && spotsRemaining <= 20;

  const daysUntilDeadline = registrationDeadline
    ? Math.ceil((new Date(registrationDeadline).getTime() - Date.now()) / (1000 * 3600 * 24))
    : null;
  const showUrgency =
    status === "open" && daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 7;

  const href = isOwner
    ? `/tournaments/${id}`
    : status === "open"
    ? `/tournaments/${id}/register`
    : `/tournaments/${id}`;

  const ctaLabel = isOwner
    ? "Manage"
    : status === "open"
    ? "Register"
    : isLive
    ? "Watch Live"
    : "View";

  return (
    <Link
      to={href}
      className="group flex flex-col bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden hover:border-pb-rule transition-colors duration-150 h-full"
    >
      {/* Image / placeholder */}
      <div className="relative h-40 bg-pb-surface2 overflow-hidden shrink-0">
        {imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url('${imageUrl}')` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy size={32} className="text-pb-faint" />
          </div>
        )}

        {/* Status badge top-left */}
        <div className="absolute top-3 left-3">
          {isLive ? (
            <Pill tone="amber" className="flex items-center gap-1.5 shadow-sm">
              <Dot color="amber" size={6} pulse />
              Live
            </Pill>
          ) : status === "open" ? (
            <Pill tone="court" className="shadow-sm">Open</Pill>
          ) : status === "completed" ? (
            <Pill tone="ink" className="shadow-sm">Completed</Pill>
          ) : (
            <Pill tone="neutral" className="shadow-sm capitalize">{status}</Pill>
          )}
        </div>

        {/* Urgency badge top-right */}
        {showUrgency && (
          <div className="absolute top-3 right-3">
            <Pill tone="amber" className="shadow-sm">
              {daysUntilDeadline}d left
            </Pill>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Name */}
        <h3 className="font-display font-bold text-[17px] tracking-[-0.02em] leading-snug text-pb-ink line-clamp-2 group-hover:text-pb-court transition-colors">
          {name}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-[12px] font-mono text-pb-muted">
            <MapPin size={11} />
            {shortLocation}
          </span>
          <span className="text-pb-hairline">·</span>
          <span className="text-[12px] font-mono text-pb-muted">
            {startDate} – {endDate}
          </span>
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap gap-1.5">
          {skillLevel && <Pill tone="neutral">{skillLevel}</Pill>}
          {eventCount > 0 && (
            <Pill tone="neutral" mono>{eventCount} event{eventCount !== 1 ? "s" : ""}</Pill>
          )}
          <Pill tone="neutral" mono>{entryFee ? `$${entryFee}` : "Free"}</Pill>
        </div>

        {/* Spots bar */}
        {status !== "completed" && (
          <div className="mt-auto pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-mono text-pb-muted">
                <Users size={10} />
                {spotsFilled}/{spotsTotal}
              </span>
              {isFillingFast && (
                <span className="text-[10px] font-mono text-pb-amber uppercase tracking-[0.08em]">
                  Filling fast
                </span>
              )}
            </div>
            <div className="h-[3px] bg-pb-hairline rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isFillingFast ? "bg-pb-amber" : "bg-pb-court"
                )}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-1">
          <PbBtn
            variant={status === "open" && !isOwner ? "court" : "outline"}
            size="sm"
            full
            className="pointer-events-none"
          >
            {ctaLabel} <ArrowRight size={13} />
          </PbBtn>
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
