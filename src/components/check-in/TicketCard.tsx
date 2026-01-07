import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Download, Copy, CheckCircle, Clock, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

interface TicketCardProps {
  payment: {
    paymentId: string;
    ticketCode: string;
    qrCodeUrl: string;
    ticketPdfUrl?: string;
    tournament: {
      id: string;
      name: string;
      location: string;
      startDate: string;
      status: string;
    };
    events: Array<{
      id: string;
      name: string;
    }>;
    teams?: Array<{
      id: string;
      name: string;
    }>;
    amount: number;
    checkedIn?: {
      checkedInAt: string;
      checkedInBy: string;
      method: string;
    };
    createdAt: string;
  };
  compact?: boolean;
}

export default function TicketCard({ payment, compact = false }: TicketCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyTicketCode = async () => {
    await navigator.clipboard.writeText(payment.ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (payment.ticketPdfUrl) {
      window.open(payment.ticketPdfUrl, '_blank');
    }
  };

  const isCheckedIn = !!payment.checkedIn?.checkedInAt;
  const isPastEvent = new Date(payment.tournament.startDate) < new Date();

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-gray-900 truncate">
              {payment.tournament.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {payment.events.map((event) => (
                <Badge key={event.id} variant="outline" className="bg-white">
                  {event.name}
                </Badge>
              ))}
            </div>
          </div>
          <Badge
            variant={isCheckedIn ? 'default' : 'secondary'}
            className={isCheckedIn ? 'bg-green-600' : 'bg-gray-400'}
          >
            {isCheckedIn ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Checked In
              </>
            ) : isPastEvent ? (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Past Event
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="font-medium">
              {format(new Date(payment.tournament.startDate), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          {payment.tournament.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-green-600" />
              <span>{payment.tournament.location}</span>
            </div>
          )}
        </div>

        {!compact && (
          <>
            {/* QR Code Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 text-center">
              <div className="font-display text-sm font-semibold text-green-800 mb-3 uppercase tracking-wide">
                Your Event Ticket
              </div>

              {payment.qrCodeUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg shadow-md border-4 border-white inline-block">
                    <img
                      src={payment.qrCodeUrl}
                      alt="QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-green-500">
                    <code className="font-mono text-sm font-bold text-green-700">
                      {payment.ticketCode}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTicketCode}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-green-700 mt-3 max-w-xs">
                    Present this QR code at check-in on event day
                  </p>
                </div>
              ) : (
                <div className="text-gray-500 py-8">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Ticket generating...</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {payment.ticketPdfUrl && (
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Ticket
                </Button>
              </div>
            )}

            {/* Teams Info (if applicable) */}
            {payment.teams && payment.teams.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Teams
                </div>
                <div className="flex flex-wrap gap-1">
                  {payment.teams.map((team) => (
                    <span key={team.id} className="text-sm text-gray-800">
                      {team.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Check-in Info */}
            {isCheckedIn && payment.checkedIn && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <div className="text-sm">
                    <span className="font-semibold">Checked in</span>
                    <span className="text-green-600 ml-2">
                      {format(new Date(payment.checkedIn.checkedInAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Compact view - show minimal info */}
        {compact && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {payment.qrCodeUrl && (
                <img
                  src={payment.qrCodeUrl}
                  alt="QR Code"
                  className="w-16 h-16 rounded border-2 border-green-500"
                />
              )}
              <div>
                <code className="text-xs font-mono text-gray-600">
                  {payment.ticketCode}
                </code>
                <p className="text-xs text-gray-500 mt-1">
                  ${payment.amount.toFixed(2)}
                </p>
              </div>
            </div>
            {payment.ticketPdfUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadPDF}
                className="shrink-0"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
