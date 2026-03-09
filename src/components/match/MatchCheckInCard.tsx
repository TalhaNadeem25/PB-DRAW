import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Warning,
  CircleNotch,
  Users,
} from "@phosphor-icons/react";
import { matchAPI } from "@/services/api";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface MatchCheckInCardProps {
  match: any;
}

const MatchCheckInCard = ({ match }: MatchCheckInCardProps) => {
  const queryClient = useQueryClient();
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: () => matchAPI.checkIn(match._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success("Successfully checked in for the match!");
      setIsCheckingIn(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to check in");
      setIsCheckingIn(false);
    },
  });

  const handleCheckIn = () => {
    setIsCheckingIn(true);
    checkInMutation.mutate();
  };

  const getCheckInStatus = () => {
    if (!match.checkIn || !match.checkIn.required) return null;

    const team1Status = match.checkIn.team1?.status || 'pending';
    const team2Status = match.checkIn.team2?.status || 'pending';

    return { team1Status, team2Status };
  };

  const checkInStatus = getCheckInStatus();
  if (!checkInStatus) return null;

  const isPastDeadline = match.checkIn?.deadline && new Date() > new Date(match.checkIn.deadline);
  const canCheckIn = !isPastDeadline && match.status === 'scheduled';

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">
                {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
              </h3>
              {match.status === 'scheduled' ? (
                <Badge variant="secondary">Scheduled</Badge>
              ) : (
                <Badge>{match.status}</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {match.scheduledTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(match.scheduledTime), 'MMM dd, yyyy')}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{format(new Date(match.scheduledTime), 'h:mm a')}</span>
                </div>
              )}
              {match.courtNumber && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span>Court {match.courtNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Check-in Status */}
        <div className="bg-muted/50 p-3 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Check-in Status</span>
            {match.checkIn?.deadline && (
              <span className="text-xs text-muted-foreground">
                Deadline: {isPastDeadline ? 'Passed' : formatDistanceToNow(new Date(match.checkIn.deadline), { addSuffix: true })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              {checkInStatus.team1Status === 'checked-in' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : checkInStatus.team1Status === 'no-show' ? (
                <Warning className="w-4 h-4 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 text-orange-600" />
              )}
              <div className="text-sm">
                <div className="font-medium">{match.team1?.name || 'Team 1'}</div>
                <div className={`text-xs capitalize ${
                  checkInStatus.team1Status === 'checked-in' ? 'text-green-600' :
                  checkInStatus.team1Status === 'no-show' ? 'text-red-600' :
                  'text-orange-600'
                }`}>
                  {checkInStatus.team1Status === 'pending' ? 'Not checked in' : checkInStatus.team1Status}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {checkInStatus.team2Status === 'checked-in' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : checkInStatus.team2Status === 'no-show' ? (
                <Warning className="w-4 h-4 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 text-orange-600" />
              )}
              <div className="text-sm">
                <div className="font-medium">{match.team2?.name || 'Team 2'}</div>
                <div className={`text-xs capitalize ${
                  checkInStatus.team2Status === 'checked-in' ? 'text-green-600' :
                  checkInStatus.team2Status === 'no-show' ? 'text-red-600' :
                  'text-orange-600'
                }`}>
                  {checkInStatus.team2Status === 'pending' ? 'Not checked in' : checkInStatus.team2Status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Button */}
        {canCheckIn && (checkInStatus.team1Status === 'pending' || checkInStatus.team2Status === 'pending') && (
          <Button
            onClick={handleCheckIn}
            disabled={checkInMutation.isPending || isCheckingIn}
            className="w-full"
          >
            {checkInMutation.isPending || isCheckingIn ? (
              <>
                <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Check In for Match
              </>
            )}
          </Button>
        )}

        {isPastDeadline && checkInStatus.team1Status === 'pending' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <Warning className="w-4 h-4 inline mr-2" />
            Check-in deadline has passed
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchCheckInCard;
