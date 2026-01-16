import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Trophy } from "lucide-react";
import { format } from "date-fns";

interface Team {
  _id: string;
  name: string;
  players: any[];
}

interface Match {
  _id: string;
  team1: Team | null;
  team2: Team | null;
  team1Score?: number;
  team2Score?: number;
  status: string;
  bracket?: string;
  round?: number;
  matchNumber?: number;
}

interface Tournament {
  _id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
}

interface Event {
  _id: string;
  name: string;
  gameType: string;
  skillLevel: string;
}

interface PrintableBracketProps {
  tournament: Tournament;
  event?: Event;
  matches: Match[];
  bracketType?: 'single-elimination' | 'double-elimination';
  onClose?: () => void;
}

const PrintableBracket = ({ tournament, event, matches, bracketType = 'single-elimination', onClose }: PrintableBracketProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .header .event-name { font-size: 18px; color: #16a34a; font-weight: 600; }
        .header p { font-size: 14px; color: #666; margin-top: 8px; }
        .bracket-container { display: flex; gap: 40px; justify-content: center; padding: 20px 0; overflow-x: auto; }
        .round { display: flex; flex-direction: column; gap: 20px; min-width: 200px; }
        .round-title { font-size: 14px; font-weight: 600; text-align: center; padding: 8px; background: #f5f5f5; border-radius: 4px; margin-bottom: 10px; }
        .match-card { border: 2px solid #e5e5e5; border-radius: 8px; overflow: hidden; background: white; }
        .match-card.completed { border-color: #16a34a; }
        .match-number { font-size: 10px; color: #999; padding: 4px 8px; background: #fafafa; border-bottom: 1px solid #eee; }
        .team-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #eee; }
        .team-row:last-child { border-bottom: none; }
        .team-row.winner { background: #f0fdf4; font-weight: 600; }
        .team-name { font-size: 13px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .team-name.tbd { color: #999; font-style: italic; }
        .score { font-size: 14px; font-weight: 600; min-width: 24px; text-align: center; }
        .winner-section { text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 2px solid #16a34a; }
        .winner-section h3 { font-size: 16px; color: #666; margin-bottom: 8px; }
        .winner-section .trophy { font-size: 40px; margin-bottom: 10px; }
        .winner-section .winner-name { font-size: 24px; font-weight: bold; color: #16a34a; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        @page { margin: 0.5in; size: landscape; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tournament.name} - Bracket</title>
          ${styles}
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Organize matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return '🏆 Finals';
    if (round === totalRounds - 1) return 'Semifinals';
    if (round === totalRounds - 2) return 'Quarterfinals';
    return `Round ${round}`;
  };

  const getWinner = () => {
    const finals = matches.find(m => m.bracket === 'finals' || m.round === Math.max(...rounds));
    if (finals?.status === 'completed') {
      const team1Score = finals.team1Score || 0;
      const team2Score = finals.team2Score || 0;
      return team1Score > team2Score ? finals.team1 : finals.team2;
    }
    return null;
  };

  const winner = getWinner();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-auto">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Print Tournament Bracket
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Preview */}
            <div 
              ref={printRef} 
              className="bg-white text-black p-6 rounded-lg border overflow-x-auto"
              style={{ minHeight: '400px' }}
            >
              {/* Header */}
              <div className="header">
                <h1>{tournament.name}</h1>
                {event && (
                  <div className="event-name">{event.name} - {event.gameType} ({event.skillLevel})</div>
                )}
                <p>
                  📍 {tournament.location} • 📅 {format(new Date(tournament.startDate), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Bracket */}
              {matches.length > 0 ? (
                <div className="bracket-container">
                  {rounds.map((round) => (
                    <div key={round} className="round">
                      <div className="round-title">
                        {getRoundName(round, rounds.length)}
                      </div>
                      {matchesByRound[round]
                        .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
                        .map((match) => {
                          const team1Score = match.team1Score || 0;
                          const team2Score = match.team2Score || 0;
                          const isCompleted = match.status === 'completed';
                          const team1Won = isCompleted && team1Score > team2Score;
                          const team2Won = isCompleted && team2Score > team1Score;

                          return (
                            <div 
                              key={match._id} 
                              className={`match-card ${isCompleted ? 'completed' : ''}`}
                            >
                              <div className="match-number">Match #{match.matchNumber || '-'}</div>
                              <div className={`team-row ${team1Won ? 'winner' : ''}`}>
                                <span className={`team-name ${!match.team1 ? 'tbd' : ''}`}>
                                  {match.team1?.name || 'TBD'}
                                </span>
                                <span className="score">
                                  {isCompleted ? team1Score : '-'}
                                </span>
                              </div>
                              <div className={`team-row ${team2Won ? 'winner' : ''}`}>
                                <span className={`team-name ${!match.team2 ? 'tbd' : ''}`}>
                                  {match.team2?.name || 'TBD'}
                                </span>
                                <span className="score">
                                  {isCompleted ? team2Score : '-'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                  No bracket matches generated yet
                </div>
              )}

              {/* Winner Section */}
              {winner && (
                <div className="winner-section">
                  <div className="trophy">🏆</div>
                  <h3>Champion</h3>
                  <div className="winner-name">{winner.name}</div>
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                Generated on {format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')} • PicklePlay Tournament Management
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintableBracket;
