import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Calendar, CalendarPlus, Check, Share2, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Link, useLocation } from "react-router-dom";
import { useWindowSize } from "react-use";

const generateICS = (name: string, startDate: string, endDate: string, location: string): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toICSDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
  };
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pickle Rally//EN',
    'BEGIN:VEVENT',
    `UID:pickle-rally-${Date.now()}@picklerally.com`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}T000000Z`,
    `DTSTART;VALUE=DATE:${toICSDate(startDate)}`,
    `DTEND;VALUE=DATE:${toICSDate(endDate)}`,
    `SUMMARY:${name}`,
    'DESCRIPTION:Registered via Pickle Rally — picklerally.com',
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
};

const RegistrationSuccess = () => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
  const location = useLocation();
  const state = location.state as {
    tournamentName?: string;
    eventIds?: string[];
    startDate?: string;
    endDate?: string;
    location?: string;
  } | null;

  const handleAddToCalendar = () => {
    if (!state?.startDate) return;
    const ics = generateICS(
      state.tournamentName || 'Pickleball Tournament',
      state.startDate,
      state.endDate || state.startDate,
      state.location || '',
    );
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(state.tournamentName || 'tournament').replace(/\s+/g, '-').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout variant="minimal">
      {showConfetti && (
        <Confetti 
          width={width} 
          height={height} 
          recycle={false} 
          numberOfPieces={400} 
          gravity={0.15} 
          colors={['#10b981', '#34d399', '#f59e0b', '#3b82f6', '#8b5cf6']}
        />
      )}
      
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6 shadow-sm border-4 border-white">
              <Check className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-3 tracking-tight">
              You're In!
            </h1>
            <p className="text-muted-foreground text-lg">
              Registration successful for {state?.tournamentName || "the tournament"}.
            </p>
          </div>

          <Card className="border-border/60 shadow-lg overflow-hidden mb-8">
            <div className="h-2 bg-hero-gradient w-full" />
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-lg mb-4 text-center">What's Next?</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Access your ticket</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your QR code ticket is ready in your dashboard. You'll need this for check-in.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Save the date</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll generate the match schedule 48 hours before the tournament starts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Invite friends</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pickleball is better with friends. Share the tournament to build the hype!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-xl font-display font-bold uppercase tracking-widest text-sm" asChild>
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            {state?.startDate && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-display font-bold uppercase tracking-widest text-sm"
                onClick={handleAddToCalendar}
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>
            )}
            <Button variant="outline" className="w-full h-12 rounded-xl font-display font-bold uppercase tracking-widest text-sm" asChild>
              <Link to="/tournaments">
                Find More Tournaments
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegistrationSuccess;
