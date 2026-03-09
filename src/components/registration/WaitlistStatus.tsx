import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Clock, Users, CheckCircle, Warning, ArrowRight } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface WaitlistStatusProps {
  entry: {
    _id: string;
    event: {
      _id: string;
      name: string;
      maxTeams: number;
    };
    tournament: {
      _id: string;
      name: string;
      startDate: string;
    };
    position: number;
    status: 'waiting' | 'promoted' | 'expired' | 'converted' | 'cancelled';
    promotedAt?: string;
    promotionExpiresAt?: string;
    metadata?: {
      partnerEmail?: string;
      partnerName?: string;
      teamName?: string;
    };
  };
}

export default function WaitlistStatus({ entry }: WaitlistStatusProps) {
  const isPromoted = entry.status === 'promoted';
  const isExpired = entry.status === 'expired';
  const isWaiting = entry.status === 'waiting';

  // Calculate progress (position in relation to max teams)
  const progressPercent = Math.max(0, Math.min(100, ((entry.event.maxTeams - entry.position) / entry.event.maxTeams) * 100));

  // Calculate time remaining for promoted status
  const getTimeRemaining = () => {
    if (!entry.promotionExpiresAt) return null;

    const now = new Date();
    const expires = new Date(entry.promotionExpiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className={`
      border-l-4 transition-all hover:shadow-md
      ${isPromoted ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/30' : ''}
      ${isExpired ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/30' : ''}
      ${isWaiting ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30' : ''}
    `}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={
                isPromoted ? 'default' :
                isExpired ? 'destructive' :
                'secondary'
              } className={
                isPromoted ? 'bg-green-600' :
                isExpired ? 'bg-red-600' :
                'bg-yellow-600'
              }>
                {isPromoted && <CheckCircle className="w-3 h-3 mr-1" />}
                {isExpired && <Warning className="w-3 h-3 mr-1" />}
                {isWaiting && <Clock className="w-3 h-3 mr-1" />}
                {isPromoted ? 'Promoted' : isExpired ? 'Expired' : `#${entry.position}`}
              </Badge>
            </div>

            <h4 className="font-semibold text-foreground text-sm truncate">
              {entry.tournament.name}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {entry.event.name}
            </p>

            {entry.metadata?.teamName && (
              <p className="text-xs text-muted-foreground mt-1">
                Team: {entry.metadata.teamName}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {format(new Date(entry.tournament.startDate), 'MMM d, yyyy')}
            </div>
          </div>

          {/* Right: Position/Status */}
          <div className="text-right shrink-0">
            {isWaiting && (
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  #{entry.position}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  in line
                </div>
              </div>
            )}

            {isPromoted && getTimeRemaining() && (
              <div className="text-center">
                <div className="text-sm font-semibold text-green-700">
                  Spot Available
                </div>
                <div className="text-xs text-red-600 font-medium mt-1">
                  {getTimeRemaining()} left
                </div>
              </div>
            )}

            {isExpired && (
              <div className="text-center">
                <div className="text-xs text-red-600 font-medium">
                  Expired
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for waiting status */}
        {isWaiting && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{entry.position - 1} ahead</span>
              <span>{entry.event.maxTeams} capacity</span>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-3">
          {isPromoted && (
            <Button
              asChild
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Link to={`/tournaments/${entry.tournament._id}/register/${entry.event._id}`}>
                Complete Registration
                <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          )}

          {isWaiting && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Link to={`/tournaments/${entry.tournament._id}`}>
                View Tournament
                <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          )}

          {isExpired && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full"
            >
              <Link to={`/tournaments/${entry.tournament._id}/register/${entry.event._id}`}>
                Rejoin Waitlist
                <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
