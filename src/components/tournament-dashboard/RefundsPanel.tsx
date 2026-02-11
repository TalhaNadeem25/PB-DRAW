import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
  Loader2,
  XCircle,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cancellationAPI } from "@/services/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import IssueRefundDialog from "./IssueRefundDialog";
import BulkRefundDialog from "./BulkRefundDialog";

interface RefundsPanelProps {
  tournamentId: string;
  tournamentName: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  "pending-partner-response": {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  processed: {
    label: "Processed",
    className: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
  expired: {
    label: "Expired",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const typeLabels: Record<string, string> = {
  singles: "Singles",
  "doubles-full-team": "Team",
  "doubles-one-player": "Partner Left",
  "organizer-initiated": "Organizer",
  "tournament-cancelled": "Tournament Cancelled",
};

const RefundsPanel = ({ tournamentId, tournamentName }: RefundsPanelProps) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isIssueRefundOpen, setIsIssueRefundOpen] = useState(false);
  const [isBulkRefundOpen, setIsBulkRefundOpen] = useState(false);

  const {
    data: cancellationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tournament-cancellations", tournamentId],
    queryFn: () => cancellationAPI.getTournamentCancellations(tournamentId),
    enabled: !!tournamentId,
  });

  const cancellations = cancellationsData?.data || [];

  // Stats
  const totalRefunded = cancellations
    .filter((c: any) => c.status === "processed")
    .reduce((sum: number, c: any) => sum + (c.refundAmount || 0), 0);

  const pendingCount = cancellations.filter(
    (c: any) => c.status === "pending-partner-response" || c.status === "approved"
  ).length;

  const processedCount = cancellations.filter((c: any) => c.status === "processed").length;

  // Filter cancellations
  const filtered = cancellations.filter((c: any) => {
    const statusMatch = statusFilter === "all" || c.status === statusFilter;
    const searchMatch =
      !searchQuery ||
      c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.event?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Refunded */}
        <div className="glass-card-hover rounded-2xl p-5 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 group-hover:bg-hero-gradient flex items-center justify-center transition-all duration-300">
              <DollarSign className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Total Refunded
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            ${(totalRefunded / 100).toFixed(2)}
          </p>
        </div>

        {/* Pending */}
        <div className="glass-card-hover rounded-2xl p-5 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 group-hover:bg-hero-gradient flex items-center justify-center transition-all duration-300">
              <Clock className="w-5 h-5 text-yellow-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Pending
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{pendingCount}</p>
        </div>

        {/* Processed */}
        <div className="glass-card-hover rounded-2xl p-5 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-hero-gradient flex items-center justify-center transition-all duration-300">
              <CheckCircle2 className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Processed
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{processedCount}</p>
        </div>

        {/* Total Cancellations */}
        <div className="glass-card-hover rounded-2xl p-5 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 group-hover:bg-hero-gradient flex items-center justify-center transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
              Total Requests
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{cancellations.length}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          className="rounded-xl gap-2 font-display"
          onClick={() => setIsIssueRefundOpen(true)}
        >
          <DollarSign className="w-4 h-4" />
          Issue Refund
        </Button>
        <Button
          variant="outline"
          className="rounded-xl gap-2 font-display border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => setIsBulkRefundOpen(true)}
        >
          <XCircle className="w-4 h-4" />
          Cancel Tournament
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl ml-auto"
          onClick={() => refetch()}
        >
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Cancellations Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Filter bar */}
        <div className="px-5 py-4 border-b border-border/40 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 glass rounded-xl text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 rounded-xl text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending-partner-response">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <RefreshCcw className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg mb-1">No cancellations or refunds yet</h3>
            <p className="text-sm text-muted-foreground">
              Refund requests and cancellations will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-5 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Player
                  </th>
                  <th className="text-left px-5 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Event
                  </th>
                  <th className="text-left px-5 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Type
                  </th>
                  <th className="text-right px-5 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-center px-5 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cancellation: any, idx: number) => {
                  const config = statusConfig[cancellation.status] || statusConfig.cancelled;
                  return (
                    <tr
                      key={cancellation._id}
                      className={cn(
                        "border-b border-border/20 hover:bg-muted/30 transition-colors",
                        idx % 2 === 0 && "bg-muted/10"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {cancellation.user?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cancellation.user?.email || ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {cancellation.event?.name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {typeLabels[cancellation.cancellationType] || cancellation.cancellationType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-display font-bold text-foreground">
                          ${((cancellation.refundAmount || 0) / 100).toFixed(2)}
                        </span>
                        {cancellation.refundPercentage < 100 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({cancellation.refundPercentage}%)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant="outline" className={cn("text-xs", config.className)}>
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground text-xs">
                        {cancellation.createdAt
                          ? format(new Date(cancellation.createdAt), "MMM d, yyyy")
                          : "—"}
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
