import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, DownloadSimple, Calendar, MapPin, Users, Clock } from "@phosphor-icons/react";
import { format } from "date-fns";

interface Match {
  _id: string;
  team1: { name: string; players: any[] };
  team2: { name: string; players: any[] } | null;
  team1Score?: number;
  team2Score?: number;
  status: string;
  court?: string;
  scheduledTime?: string;
  round?: number;
  bracket?: string;
}

interface Event {
  _id: string;
  name: string;
  gameType: string;
  skillLevel: string;
  matches?: Match[];
}

interface Tournament {
  _id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  events?: Event[];
}

interface PrintableScheduleProps {
  tournament: Tournament;
  matches: Match[];
  events?: Event[];
  onClose?: () => void;
}

const PrintableSchedule = ({ tournament, matches, events = [], onClose }: PrintableScheduleProps) => {
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
        .header p { font-size: 14px; color: #666; }
        .info-row { display: flex; gap: 20px; justify-content: center; margin-top: 12px; font-size: 13px; }
        .info-item { display: flex; align-items: center; gap: 6px; }
        .event-section { margin-bottom: 30px; page-break-inside: avoid; }
        .event-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; padding: 8px 12px; background: #f0fdf4; border-left: 4px solid #16a34a; }
        .matches-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .matches-table th { background: #f5f5f5; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
        .matches-table td { padding: 10px 8px; border-bottom: 1px solid #eee; }
        .matches-table tr:nth-child(even) { background: #fafafa; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 500; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-completed { background: #d1fae5; color: #065f46; }
        .badge-in-progress { background: #dbeafe; color: #1e40af; }
        .score { font-weight: 600; text-align: center; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        @page { margin: 0.5in; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tournament.name} - Schedule</title>
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

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'badge-pending',
      completed: 'badge-completed',
      'in-progress': 'badge-in-progress',
    };
    return classes[status] || 'badge-pending';
  };

  // Group matches by event or use provided events
  const matchesByEvent = matches.reduce((acc, match) => {
    const eventId = (match as any).event?._id || 'general';
    if (!acc[eventId]) acc[eventId] = [];
    acc[eventId].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-auto">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Print Tournament Schedule
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
            {/* Preview (also used for printing) */}
            <div 
              ref={printRef} 
              className="bg-white text-black p-6 rounded-lg border"
              style={{ minHeight: '400px' }}
            >
              {/* Header */}
              <div className="header">
                <h1>{tournament.name}</h1>
                <p>Tournament Schedule</p>
                <div className="info-row">
                  <span className="info-item">
                    📍 {tournament.location}
                  </span>
                  <span className="info-item">
                    📅 {format(new Date(tournament.startDate), 'MMM d')} - {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              {/* Matches by Event */}
              {Object.entries(matchesByEvent).map(([eventId, eventMatches]) => {
                const event = events.find(e => e._id === eventId);
                return (
                  <div key={eventId} className="event-section">
                    <div className="event-title">
                      {event ? `${event.name} - ${event.gameType} (${event.skillLevel?.includes("-") ? event.skillLevel : `${event.skillLevel ?? ""}+`})` : 'All Matches'}
                    </div>
                    <table className="matches-table">
                      <thead>
                        <tr>
                          <th style={{ width: '8%' }}>#</th>
                          <th style={{ width: '25%' }}>Team 1</th>
                          <th style={{ width: '10%' }}>Score</th>
                          <th style={{ width: '25%' }}>Team 2</th>
                          <th style={{ width: '12%' }}>Court</th>
                          <th style={{ width: '10%' }}>Time</th>
                          <th style={{ width: '10%' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventMatches.map((match, index) => (
                          <tr key={match._id}>
                            <td>{index + 1}</td>
                            <td>{match.team1?.name || 'TBD'}</td>
                            <td className="score">
                              {match.status === 'completed' 
                                ? `${match.team1Score || 0} - ${match.team2Score || 0}`
                                : '-'
                              }
                            </td>
                            <td>{match.team2?.name || 'TBD'}</td>
                            <td>{match.court || '-'}</td>
                            <td>
                              {match.scheduledTime 
                                ? format(new Date(match.scheduledTime), 'h:mm a')
                                : '-'
                              }
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(match.status)}`}>
                                {match.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {matches.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No matches scheduled yet
                </div>
              )}

              {/* Footer */}
              <div className="footer">
                Generated on {format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')} • Picklix Tournament Management
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrintableSchedule;
