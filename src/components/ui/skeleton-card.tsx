import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A reusable skeleton representing a Tournament or generic list item card.
 * Standardizes the "shimmer effect" loading state across the application.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("glass border-0 shadow-float overflow-hidden flex flex-col h-full", className)}>
      {/* Top visual accent (simulated gradient border) */}
      <div className="h-1 bg-muted animate-pulse" />

      <CardHeader className="pt-5 pb-2">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1 mr-4">
            <Skeleton className="h-6 w-3/4 rounded-md" /> {/* Title */}
            <Skeleton className="h-4 w-full rounded-md" /> {/* Description line 1 */}
            <Skeleton className="h-4 w-5/6 rounded-md" /> {/* Description line 2 */}
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" /> {/* Status Badge */}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
        {/* Date Row */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>

        {/* Location Row */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          <Skeleton className="h-4 w-2/5 rounded-md" />
        </div>

        {/* Metrics/Icons Row */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Renders a grid of SkeletonCards for loading states in lists
 */
export function SkeletonGrid({ count = 6, className }: { count?: number, className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a list of rows (dashboard panels, tickets, teams, etc.)
 */
export function SkeletonList({ count = 3, className }: { count?: number, className?: string }) {
  return (
    <div className={cn("space-y-3 w-full", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
          <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full-page skeleton for route transition fallback
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-24 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>
      {/* Search bar */}
      <Skeleton className="h-11 w-full rounded-xl" />
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 overflow-hidden space-y-3 p-4">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
