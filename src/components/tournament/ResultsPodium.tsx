import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Medal as AwardIcon, Crown, Sparkle } from "@phosphor-icons/react";

interface Team {
  _id: string;
  name?: string;
  players: Array<{ _id: string; name: string }>;
}

interface PlacementResult {
  place: number;
  team: Team;
  score?: {
    won: number;
    lost: number;
  };
}

interface ResultsPodiumProps {
  results: PlacementResult[];
  poolName?: string;
  eventName?: string;
  showScores?: boolean;
}

const ResultsPodium = ({ results, poolName, eventName, showScores = false }: ResultsPodiumProps) => {
  // Get team display name
  const getTeamName = (team: Team) => {
    if (team.name) return team.name;
    if (team.players && team.players.length > 0) {
      return team.players.map(p => p.name).join(' / ');
    }
    return 'Unknown Team';
  };

  // Get placement details
  const getPlacementDetails = (place: number) => {
    switch (place) {
      case 1:
        return {
          title: "Champion",
          icon: Trophy,
          bgColor: "bg-gradient-to-br from-yellow-400 to-yellow-600",
          textColor: "text-yellow-600",
          borderColor: "border-yellow-500",
          height: "h-48",
          iconSize: "w-16 h-16",
          badgeColor: "bg-yellow-500",
        };
      case 2:
        return {
          title: "Runner-Up",
          icon: Medal,
          bgColor: "bg-gradient-to-br from-gray-300 to-gray-500",
          textColor: "text-gray-600",
          borderColor: "border-gray-400",
          height: "h-40",
          iconSize: "w-12 h-12",
          badgeColor: "bg-gray-400",
        };
      case 3:
        return {
          title: "3rd Place",
          icon: AwardIcon,
          bgColor: "bg-gradient-to-br from-orange-400 to-orange-600",
          textColor: "text-orange-600",
          borderColor: "border-orange-500",
          height: "h-32",
          iconSize: "w-10 h-10",
          badgeColor: "bg-orange-500",
        };
      default:
        return {
          title: `${place}th Place`,
          icon: AwardIcon,
          bgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
          textColor: "text-blue-600",
          borderColor: "border-blue-500",
          height: "h-28",
          iconSize: "w-8 h-8",
          badgeColor: "bg-blue-500",
        };
    }
  };

  if (!results || results.length === 0) {
    return null;
  }

  const topThree = results.filter(r => r.place <= 3).sort((a, b) => a.place - b.place);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-primary" />
          <CardTitle className="text-center text-2xl">Tournament Champions</CardTitle>
          <Sparkle className="w-6 h-6 text-primary" />
        </div>
        {(eventName || poolName) && (
          <CardDescription className="text-center text-base">
            {eventName} {poolName && `- ${poolName}`}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-8 pb-12">
        {/* Podium Display */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* Reorder for podium effect: 2nd, 1st, 3rd */}
          {topThree.length >= 2 && (() => {
            const second = topThree.find(r => r.place === 2);
            if (!second) return null;
            const details = getPlacementDetails(2);
            const Icon = details.icon;

            return (
              <div className="flex flex-col items-center gap-3" style={{ width: '180px' }}>
                <div className={`${details.bgColor} rounded-full p-4 shadow-lg`}>
                  <Icon className={`${details.iconSize} text-white`} />
                </div>
                <div className="text-center">
                  <Badge className={`${details.badgeColor} text-white mb-2`}>
                    2nd Place
                  </Badge>
                  <div className="font-bold text-lg">{getTeamName(second.team)}</div>
                  {second.team.players && second.team.players.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {second.team.players.map(p => p.name).join(', ')}
                    </div>
                  )}
                  {showScores && second.score && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Record: {second.score.won}-{second.score.lost}
                    </div>
                  )}
                </div>
                <div className={`${details.height} w-full ${details.bgColor} rounded-t-lg shadow-xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-4xl">2</span>
                </div>
              </div>
            );
          })()}

          {/* 1st Place */}
          {topThree.length >= 1 && (() => {
            const first = topThree.find(r => r.place === 1);
            if (!first) return null;
            const details = getPlacementDetails(1);
            const Icon = details.icon;

            return (
              <div className="flex flex-col items-center gap-3" style={{ width: '200px' }}>
                <div className="relative">
                  <div className={`${details.bgColor} rounded-full p-5 shadow-2xl animate-pulse`}>
                    <Icon className={`${details.iconSize} text-white`} />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="text-center">
                  <Badge className={`${details.badgeColor} text-white mb-2 text-base`}>
                    Champion
                  </Badge>
                  <div className="font-bold text-xl">{getTeamName(first.team)}</div>
                  {first.team.players && first.team.players.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {first.team.players.map(p => p.name).join(', ')}
                    </div>
                  )}
                  {showScores && first.score && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Record: {first.score.won}-{first.score.lost}
                    </div>
                  )}
                </div>
                <div className={`${details.height} w-full ${details.bgColor} rounded-t-lg shadow-2xl flex items-center justify-center border-4 ${details.borderColor}`}>
                  <span className="text-white font-bold text-5xl">1</span>
                </div>
              </div>
            );
          })()}

          {/* 3rd Place */}
          {topThree.length >= 3 && (() => {
            const third = topThree.find(r => r.place === 3);
            if (!third) return null;
            const details = getPlacementDetails(3);
            const Icon = details.icon;

            return (
              <div className="flex flex-col items-center gap-3" style={{ width: '180px' }}>
                <div className={`${details.bgColor} rounded-full p-3 shadow-lg`}>
                  <Icon className={`${details.iconSize} text-white`} />
                </div>
                <div className="text-center">
                  <Badge className={`${details.badgeColor} text-white mb-2`}>
                    3rd Place
                  </Badge>
                  <div className="font-bold text-lg">{getTeamName(third.team)}</div>
                  {third.team.players && third.team.players.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {third.team.players.map(p => p.name).join(', ')}
                    </div>
                  )}
                  {showScores && third.score && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Record: {third.score.won}-{third.score.lost}
                    </div>
                  )}
                </div>
                <div className={`${details.height} w-full ${details.bgColor} rounded-t-lg shadow-xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-4xl">3</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Congratulations Message */}
        {topThree.length > 0 && (
          <div className="text-center">
            <p className="text-lg font-semibold text-primary">
              🎉 Congratulations to all our champions! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultsPodium;
