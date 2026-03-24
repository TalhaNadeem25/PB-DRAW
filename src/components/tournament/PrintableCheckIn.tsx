import { useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, ClipboardText } from "@phosphor-icons/react";
import { format } from "date-fns";
import { printHTML } from "@/lib/printUtils";

interface Player {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  skillLevel?: number;
}

interface Team {
  _id: string;
  name: string;
  players: Player[];
  event?: {
    _id: string;
    name: string;
    gameType: string;
    skillLevel: string;
  };
  checkedIn?: boolean;
  checkInTime?: string;
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

interface PrintableCheckInProps {
  tournament: Tournament;
  teams: Team[];
  events?: Event[];
  onClose?: () => void;
}

const PrintableCheckIn = ({ tournament, teams, events = [], onClose }: PrintableCheckInProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const styles = `
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
        .header h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .header p { font-size: 14px; color: #666; }
        .stats-row { display: flex; gap: 30px; justify-content: center; margin-top: 15px; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #16a34a; }
        .stat-label { font-size: 12px; color: #666; }
        .event-section { margin-bottom: 30px; page-break-inside: avoid; }
        .event-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; padding: 8px 12px; background: #f0fdf4; border-left: 4px solid #16a34a; }
        .checkin-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .checkin-table th { background: #f5f5f5; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
        .checkin-table td { padding: 10px 8px; border-bottom: 1px solid #eee; }
        .checkin-table tr:nth-child(even) { background: #fafafa; }
        .checkbox { width: 20px; height: 20px; border: 2px solid #ccc; border-radius: 4px; display: inline-block; }
        .checkbox.checked { background: #16a34a; border-color: #16a34a; position: relative; }
        .checkbox.checked::after { content: '✓'; color: white; position: absolute; top: -2px; left: 3px; font-size: 14px; }
        .player-list { font-size: 11px; color: #666; margin-top: 4px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; margin-left: 8px; }
        .badge-checked { background: #d1fae5; color: #065f46; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .notes-area { margin-top: 8px; border: 1px dashed #ccc; height: 30px; border-radius: 4px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        @page { margin: 0.5in; }
      </style>
    `;

    printHTML(`${styles}</head><body>${content.innerHTML}`, `${tournament.name} - Check-In List`);
  };

  // Group teams by event
  const teamsByEvent = teams.reduce((acc, team) => {
    const eventId = team.event?._id || 'general';
    if (!acc[eventId]) acc[eventId] = [];
    acc[eventId].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const totalTeams = teams.length;
  const checkedInTeams = teams.filter(t => t.checkedIn).length;
  const totalPlayers = teams.reduce((sum, t) => sum + (t.players?.length || 0), 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm overflow-auto">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardText className="h-5 w-5 text-primary" />
              Print Check-In List
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
              className="bg-white text-black p-6 rounded-lg border"
              style={{ minHeight: '400px' }}
            >
              {/* Header */}
              <div className="header">
                <h1>{tournament.name}</h1>
                <p>Player Check-In List</p>
                <p>📍 {tournament.location} • 📅 {format(new Date(tournament.startDate), 'MMMM d, yyyy')}</p>
                
                <div className="stats-row">
                  <div className="stat-item">
                    <div className="stat-value">{totalTeams}</div>
                    <div className="stat-label">Total Teams</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{totalPlayers}</div>
                    <div className="stat-label">Total Players</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{checkedInTeams}</div>
                    <div className="stat-label">Checked In</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{totalTeams - checkedInTeams}</div>
                    <div className="stat-label">Remaining</div>
                  </div>
                </div>
              </div>

              {/* Teams by Event */}
              {Object.entries(teamsByEvent).map(([eventId, eventTeams]) => {
                const event = events.find(e => e._id === eventId) || eventTeams[0]?.event;
                return (
                  <div key={eventId} className="event-section">
                    <div className="event-title">
                      {event ? `${event.name} - ${event.gameType} (${event.skillLevel?.includes("-") ? event.skillLevel : `${event.skillLevel ?? ""}+`})` : 'General'}
                      <span style={{ float: 'right', fontWeight: 'normal', fontSize: '14px' }}>
                        {eventTeams.length} teams
                      </span>
                    </div>
                    <table className="checkin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '6%' }}>✓</th>
                          <th style={{ width: '6%' }}>#</th>
                          <th style={{ width: '25%' }}>Team Name</th>
                          <th style={{ width: '35%' }}>Players</th>
                          <th style={{ width: '13%' }}>Contact</th>
                          <th style={{ width: '15%' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventTeams.map((team, index) => (
                          <tr key={team._id}>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`checkbox ${team.checkedIn ? 'checked' : ''}`}></span>
                            </td>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{team.name}</strong>
                              {team.checkedIn && (
                                <span className="badge badge-checked">✓ Checked In</span>
                              )}
                            </td>
                            <td>
                              {team.players?.map((player, pIndex) => (
                                <div key={player._id || pIndex} style={{ marginBottom: '2px' }}>
                                  {player.name}
                                  {player.skillLevel && (
                                    <span style={{ color: '#999', marginLeft: '4px' }}>
                                      ({player.skillLevel})
                                    </span>
                                  )}
                                </div>
                              )) || '-'}
                            </td>
                            <td style={{ fontSize: '11px' }}>
                              {team.players?.[0]?.phone || team.players?.[0]?.email?.split('@')[0] || '-'}
                            </td>
                            <td>
                              <div className="notes-area"></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {teams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                  No teams registered yet
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                Generated on {format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')} • PB Draw Tournament Management
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default PrintableCheckIn;
