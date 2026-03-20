import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Printer, FileText, Trophy, ClipboardText, DownloadSimple, Table } from "@phosphor-icons/react";
import PrintableSchedule from "./PrintableSchedule";
import PrintableBracket from "./PrintableBracket";
import PrintableCheckIn from "./PrintableCheckIn";
import PrintablePoolSheets from "./PrintablePoolSheets";

interface Team {
  _id: string;
  name: string;
  players: any[];
  event?: any;
  checkedIn?: boolean;
}

interface Match {
  _id: string;
  team1: any;
  team2: any | null;
  team1Score?: number;
  team2Score?: number;
  status: string;
  court?: string;
  scheduledTime?: string;
  round?: number;
  bracket?: string;
  matchNumber?: number;
}

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
  endDate: string;
  events?: Event[];
}

interface ExportButtonsProps {
  tournament: Tournament;
  matches?: Match[];
  teams?: Team[];
  events?: Event[];
  playoffMatches?: Match[];
  selectedEvent?: Event;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const ExportButtons = ({
  tournament,
  matches = [],
  teams = [],
  events = [],
  playoffMatches = [],
  selectedEvent,
  variant = "outline",
  size = "sm",
}: ExportButtonsProps) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showBracket, setShowBracket] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPoolSheets, setShowPoolSheets] = useState(false);

  // Use playoff matches if available, otherwise use regular matches
  const bracketMatches = playoffMatches.length > 0 ? playoffMatches : matches.filter(m => m.bracket);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-[9999]">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowSchedule(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Tournament Schedule
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowBracket(true)}
            disabled={bracketMatches.length === 0}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Playoff Bracket
            {bracketMatches.length === 0 && (
              <span className="ml-auto text-xs text-muted-foreground">No bracket</span>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowCheckIn(true)}>
            <ClipboardText className="h-4 w-4 mr-2" />
            Check-In List
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowPoolSheets(true)}
            disabled={events.length === 0}
          >
            <Table className="h-4 w-4 mr-2" />
            Pool Sheets
            {events.length === 0 && (
              <span className="ml-auto text-xs text-muted-foreground">No events</span>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => {
              // Export all to CSV
              const csvContent = generateCSV(tournament, matches, teams);
              downloadCSV(csvContent, `${tournament.name.replace(/\s+/g, '_')}_data.csv`);
            }}
          >
            <DownloadSimple className="h-4 w-4 mr-2" />
            Export to CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Print Modals */}
      {showSchedule && (
        <PrintableSchedule
          tournament={tournament}
          matches={matches}
          events={events}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {showBracket && (
        <PrintableBracket
          tournament={tournament}
          event={selectedEvent}
          matches={bracketMatches}
          onClose={() => setShowBracket(false)}
        />
      )}

      {showCheckIn && (
        <PrintableCheckIn
          tournament={tournament}
          teams={teams}
          events={events}
          onClose={() => setShowCheckIn(false)}
        />
      )}

      {showPoolSheets && (
        <PrintablePoolSheets
          tournament={tournament}
          events={events}
          onClose={() => setShowPoolSheets(false)}
        />
      )}
    </>
  );
};

// Helper functions for CSV export
function generateCSV(tournament: Tournament, matches: Match[], teams: Team[]): string {
  const lines: string[] = [];
  
  // Header info
  lines.push(`Tournament:,${escapeCSV(tournament.name)}`);
  lines.push(`Location:,${escapeCSV(tournament.location)}`);
  lines.push(`Date:,${tournament.startDate} - ${tournament.endDate}`);
  lines.push('');
  
  // Teams section
  lines.push('REGISTERED TEAMS');
  lines.push('Team Name,Players,Event,Checked In');
  teams.forEach(team => {
    const playerNames = team.players?.map(p => p.name).join('; ') || '';
    const eventName = team.event?.name || '';
    lines.push(`${escapeCSV(team.name)},${escapeCSV(playerNames)},${escapeCSV(eventName)},${team.checkedIn ? 'Yes' : 'No'}`);
  });
  lines.push('');
  
  // Matches section
  lines.push('MATCHES');
  lines.push('Match #,Team 1,Score,Team 2,Status,Court,Time');
  matches.forEach((match, index) => {
    const score = match.status === 'completed' 
      ? `${match.team1Score || 0} - ${match.team2Score || 0}` 
      : '-';
    lines.push([
      index + 1,
      escapeCSV(match.team1?.name || 'TBD'),
      score,
      escapeCSV(match.team2?.name || 'TBD'),
      match.status,
      match.court || '-',
      match.scheduledTime || '-'
    ].join(','));
  });
  
  return lines.join('\n');
}

function escapeCSV(str: string): string {
  if (!str) return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default ExportButtons;
