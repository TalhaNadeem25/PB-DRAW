import { useState } from "react";
import {
  CurrencyDollar,
  Clock,
  CheckCircle,
  TrendUp,
  MagnifyingGlass,
  CircleNotch,
  XCircle,
  ArrowsCounterClockwise,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { cancellationAPI } from "@/services/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import IssueRefundDialog from "./IssueRefundDialog";
import BulkRefundDialog from "./BulkRefundDialog";
import { Eyebrow, Pill, PbBtn } from "@/components/ui/pb";

interface RefundsPanelProps {
  tournamentId: string;
  tournamentName: string;
}

type StatusKey = "pending-partner-response" | "approved" | "processed" | "cancelled" | "expired";

const statusTone: Record<StatusKey, "amber" | "court" | "neutral" | "ink"> = {
  "pending-partner-response": "amber",
  approved:   "court",
  processed:  "court",
  cancelled:  "neutral",
  expired:    "neutral",
};

const statusLabel: Record<StatusKey, string> = {
  "pending-partner-response": "Pending",
  approved:  "Approved",
  processed: "Processed",
  cancelled: "Cancelled",
  expired:   "Expired",
};

const typeLabels: Record<string, string> = {
  singles:                  "Singles",
  "doubles-full-team":      "Team",
  "doubles-one-player":     "Partner Left",
  "organizer-initiated":    "Organizer",
  "tournament-cancelled":   "Tournament Cancelled",
};

const RefundsPanel = ({ tournamentId, tournamentName }: RefundsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [isIssueRefundOpen, setIsIssueRefundOpen] = useState(false);
  const [isBulkRefundOpen, setIsBulkRefundOpen]   = useState(false);

  const { data: cancellationsData, isLoading, refetch } = useQuery({
    queryKey: ["tournament-cancellations", tournamentId],
    queryFn:  () => cancellationAPI.getTournamentCancellations(tournamentId),
    enabled:  !!tournamentId,
  });

  const cancellations = cancellationsData?.data || [];

  const totalRefunded = cancellations
    .filter((c: any) => c.status === "processed")
    .reduce((sum: number, c: any) => sum + (c.refundAmount || 0), 0);

  const pendingCount = cancellations.filter(
    (c: any) => c.status === "pending-partner-response" || c.status === "approved"
  ).length;

  const processedCount = cancellations.filter((c: any) => c.status === "processed").length;

  const filtered = cancellations.filter((c: any) => {
    const statusMatch = statusFilter === "all" || c.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const searchMatch =
      !q ||
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.event?.name?.toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-extrabold text-[28px] tracking-[-0.03em] text-pb-ink leading-none mb-1">
          Refunds
        </h2>
        <p className="text-[12px] font-mono text-pb-muted">Cancellations and refund requests</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: CurrencyDollar, label: "Refunded",       value: `$${(totalRefunded / 100).toFixed(2)}` },
          { icon: Clock,          label: "Pending",         value: String(pendingCount)                   },
          { icon: CheckCircle,    label: "Processed",       value: String(processedCount)                 },
          { icon: TrendUp,        label: "Total Requests",  value: String(cancellations.length)           },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-pb-surface border border-pb-hairline rounded-[6px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} className="text-pb-muted shrink-0" />
              <Eyebrow>{label}</Eyebrow>
            </div>
            <p className="font-mono font-bold text-[26px] tracking-[-0.04em] text-pb-ink leading-none">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <PbBtn variant="primary" size="md" onClick={() => setIsIssueRefundOpen(true)}>
          <CurrencyDollar size={14} /> Issue Refund
        </PbBtn>
        <PbBtn variant="outline" size="md" onClick={() => setIsBulkRefundOpen(true)} className="text-destructive border-destructive/40 hover:bg-destructive/5">
          <XCircle size={14} /> Cancel Tournament
        </PbBtn>
        <button
          onClick={() => refetch()}
          className="ml-auto h-9 w-9 rounded-[6px] border border-pb-hairline flex items-center justify-center text-pb-muted hover:border-pb-rule hover:text-pb-ink transition-colors"
        >
          <ArrowsCounterClockwise size={14} />
        </button>
      </div>

      {/* Table card */}
      <div className="bg-pb-surface border border-pb-hairline rounded-[6px] overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-3 border-b border-pb-hairline flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted" />
            <input
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-[6px] border border-pb-hairline bg-pb-surface2 text-[12px] font-mono text-pb-ink placeholder:text-pb-faint focus:outline-none focus:border-pb-rule"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full sm:w-[160px] rounded-[6px] border border-pb-hairline bg-pb-surface2 px-3 text-[12px] font-mono text-pb-ink focus:outline-none focus:border-pb-rule"
          >
            <option value="all">All Statuses</option>
            <option value="pending-partner-response">Pending</option>
            <option value="approved">Approved</option>
            <option value="processed">Processed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <CircleNotch size={22} className="animate-spin text-pb-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ArrowsCounterClockwise size={24} className="mx-auto mb-3 text-pb-faint" />
            <p className="text-[13px] font-sans font-medium text-pb-ink mb-1">No cancellations yet</p>
            <p className="text-[12px] font-mono text-pb-muted">
              Refund requests and cancellations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-pb-hairline bg-pb-surface2">
                  <th className="text-left px-5 py-2.5"><Eyebrow>Player</Eyebrow></th>
                  <th className="text-left px-5 py-2.5 hidden sm:table-cell"><Eyebrow>Event</Eyebrow></th>
                  <th className="text-left px-5 py-2.5 hidden md:table-cell"><Eyebrow>Type</Eyebrow></th>
                  <th className="text-right px-5 py-2.5"><Eyebrow>Amount</Eyebrow></th>
                  <th className="text-center px-5 py-2.5"><Eyebrow>Status</Eyebrow></th>
                  <th className="text-right px-5 py-2.5 hidden sm:table-cell"><Eyebrow>Date</Eyebrow></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-hairline">
                {filtered.map((c: any) => {
                  const tone = statusTone[c.status as StatusKey] ?? "neutral";
                  const label = statusLabel[c.status as StatusKey] ?? c.status;
                  return (
                    <tr key={c._id} className="hover:bg-pb-surface2 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-display font-semibold text-[13px] tracking-[-0.01em] text-pb-ink truncate">
                          {c.user?.name || "Unknown"}
                        </p>
                        <p className="font-mono text-[11px] text-pb-muted truncate">{c.user?.email || ""}</p>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell font-mono text-pb-muted">
                        {c.event?.name || "—"}
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell font-mono text-[11px] text-pb-muted">
                        {typeLabels[c.cancellationType] || c.cancellationType}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-mono font-semibold text-pb-ink">
                          ${((c.refundAmount || 0) / 100).toFixed(2)}
                        </span>
                        {c.refundPercentage < 100 && (
                          <span className="font-mono text-[11px] text-pb-muted ml-1">
                            ({c.refundPercentage}%)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Pill tone={tone} mono>{label}</Pill>
                      </td>
                      <td className="px-5 py-3 text-right hidden sm:table-cell font-mono text-pb-muted">
                        {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <IssueRefundDialog
        open={isIssueRefundOpen}
        onOpenChange={setIsIssueRefundOpen}
        tournamentId={tournamentId}
        onSuccess={() => refetch()}
      />
      <BulkRefundDialog
        open={isBulkRefundOpen}
        onOpenChange={setIsBulkRefundOpen}
        tournamentId={tournamentId}
        tournamentName={tournamentName}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default RefundsPanel;
