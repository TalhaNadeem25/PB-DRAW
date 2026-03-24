import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Table, CaretRight, ArrowLeft } from "@phosphor-icons/react";
import { poolAPI } from "@/services/api";
import { format } from "date-fns";
import { printHTML } from "@/lib/printUtils";

interface Event {
  _id: string;
  name: string;
  gameType: string;
  skillLevel: string;
}

interface Tournament {
  _id: string;
  name: string;
  location: string;
  startDate: string;
}

interface PrintablePoolSheetsProps {
  tournament: Tournament;
  events: Event[];
  onClose: () => void;
}

export default function PrintablePoolSheets({ tournament, events, onClose }: PrintablePoolSheetsProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const selectedEvent = events.find(e => e._id === selectedEventId);

  const { data: poolsData, isLoading } = useQuery({
    queryKey: ["pools", selectedEventId],
    queryFn: () => poolAPI.getByEvent(selectedEventId!),
    enabled: !!selectedEventId,
  });

  const pools: any[] = poolsData?.data || [];

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const styles = `
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pool-block { page-break-inside: avoid; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #16a34a; padding-bottom: 16px; }
        .header h1 { font-size: 26px; font-weight: bold; margin-bottom: 4px; }
        .header .event-name { font-size: 16px; color: #16a34a; font-weight: 600; margin-bottom: 6px; }
        .header p { font-size: 13px; color: #666; }
        .pools-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .pool-block { border: 1.5px solid #e5e5e5; border-radius: 10px; overflow: hidden; break-inside: avoid; }
        .pool-header { background: #f0fdf4; border-bottom: 1.5px solid #d1fae5; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; }
        .pool-name { font-size: 15px; font-weight: 700; color: #15803d; }
        .pool-meta { font-size: 11px; color: #666; }
        .pool-table { width: 100%; border-collapse: collapse; }
        .pool-table th { background: #f9f9f9; padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #555; border-bottom: 1px solid #eee; }
        .pool-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .pool-table tr:last-child td { border-bottom: none; }
        .player-sub { font-size: 10px; color: #888; margin-top: 2px; }
        .skill-badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 10px; background: #e0f2fe; color: #0369a1; font-weight: 500; }
        .empty { color: #aaa; font-style: italic; font-size: 12px; padding: 12px; }
        .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
        @page { margin: 0.5in; }
      </style>
    `;

    printHTML(`${styles}</head><body>${content.innerHTML}`, `${tournament.name} – Pool Sheets`);
  };

  const isSingles = selectedEvent?.gameType?.toLowerCase().includes("singles");

  const getMembers = (pool: any) => {
    if (isSingles) {
      // singles: collect unique players from matches
      const playerMap = new Map<string, any>();
      (pool.matches || []).forEach((m: any) => {
        if (m.player1) playerMap.set(m.player1._id || m.player1, m.player1);
        if (m.player2) playerMap.set(m.player2._id || m.player2, m.player2);
      });
      return [...playerMap.values()];
    }
    return pool.teams || [];
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm overflow-auto">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5 text-primary" />
              Pool Sheets
            </CardTitle>
            <div className="flex gap-2">
              {selectedEventId && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedEventId(null)} className="gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              {selectedEventId && pools.length > 0 && (
                <Button size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1 — pick an event */}
            {!selectedEventId && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Select an event to view its pool sheets:</p>
                {events.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">No events found.</p>
                )}
                {events.map(event => (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEventId(event._id)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{event.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{event.gameType} · {event.skillLevel}</div>
                    </div>
                    <CaretRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — show pools */}
            {selectedEventId && (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : pools.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Table className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No pools yet</p>
                    <p className="text-sm mt-1">Pools haven't been created for this event.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">{selectedEvent?.name}</span>
                      <Badge variant="outline" className="text-xs">{pools.length} pool{pools.length !== 1 ? "s" : ""}</Badge>
                    </div>

                    {/* Printable preview */}
                    <div ref={printRef} className="bg-white text-black rounded-lg border p-5">
                      {/* Print header */}
                      <div className="header">
                        <h1>{tournament.name}</h1>
                        <div className="event-name">{selectedEvent?.name} – Pool Sheets</div>
                        <p>
                          📍 {tournament.location} &nbsp;·&nbsp; 📅 {format(new Date(tournament.startDate), "MMMM d, yyyy")}
                        </p>
                      </div>

                      <div className="pools-grid">
                        {pools.map((pool: any) => {
                          const members = getMembers(pool);
                          return (
                            <div key={pool._id} className="pool-block">
                              <div className="pool-header">
                                <span className="pool-name">{pool.name}</span>
                                <span className="pool-meta">
                                  {members.length} {isSingles ? "player" : "team"}{members.length !== 1 ? "s" : ""}
                                  {pool.matchFormat ? ` · ${pool.matchFormat}` : ""}
                                </span>
                              </div>

                              {members.length === 0 ? (
                                <div className="empty">No {isSingles ? "players" : "teams"} assigned yet</div>
                              ) : (
                                <table className="pool-table">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>{isSingles ? "Player" : "Team"}</th>
                                      {!isSingles && <th>Players</th>}
                                      <th>Skill</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {members.map((member: any, idx: number) => (
                                      <tr key={member._id || idx}>
                                        <td>{idx + 1}</td>
                                        <td>
                                          {isSingles ? (
                                            <div>
                                              <div>{member.name || "—"}</div>
                                              {member.email && <div className="player-sub">{member.email}</div>}
                                            </div>
                                          ) : (
                                            <strong>{member.name}</strong>
                                          )}
                                        </td>
                                        {!isSingles && (
                                          <td>
                                            {member.players?.map((p: any, pi: number) => (
                                              <div key={p._id || pi} className="player-sub" style={{ color: "#333", marginTop: pi > 0 ? "3px" : 0 }}>
                                                {p.name}
                                              </div>
                                            ))}
                                          </td>
                                        )}
                                        <td>
                                          {isSingles
                                            ? member.skillLevel && <span className="skill-badge">{member.skillLevel}</span>
                                            : member.players?.[0]?.skillLevel && (
                                                <span className="skill-badge">{member.players[0].skillLevel}</span>
                                              )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="footer">
                        Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")} · PB Draw Tournament Management
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>,
    document.body
  );
}
