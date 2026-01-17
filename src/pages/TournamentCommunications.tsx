import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Send,
  Users,
  Mail,
  History,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
} from "lucide-react";
import { tournamentAPI, communicationAPI } from "@/services/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  subject: string;
  message: string;
}

interface RecipientPreview {
  count: number;
  recipients: Array<{ name: string; email: string }>;
  hasMore: boolean;
}

interface Communication {
  _id: string;
  subject: string;
  message: string;
  recipientType: string;
  recipientCount: number;
  status: string;
  sentAt: string;
  createdAt: string;
  metadata?: {
    successCount: number;
    failedCount: number;
  };
  recipientEvent?: {
    name: string;
  };
}

const recipientTypeLabels: Record<string, string> = {
  all: "All Registered Players",
  event: "Specific Event",
  waitlisted: "Waitlisted Players",
  "checked-in": "Checked-in Players",
  "not-checked-in": "Not Checked-in Players",
};

const TournamentCommunications = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(["all"]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // UI state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);

  // Fetch tournament
  const { data: tournamentData, isLoading: tournamentLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: () => communicationAPI.getTemplates(),
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['communication-history', id],
    queryFn: () => communicationAPI.getHistory(id!),
    enabled: !!id,
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: (data: { recipientType: string; recipientEventId?: string }) =>
      communicationAPI.preview(id!, data),
    onSuccess: (data) => {
      setRecipientPreview(data.data);
      setIsPreviewOpen(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to preview recipients");
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: (data: any) => communicationAPI.send(id!, data),
    onSuccess: (data) => {
      toast.success(data.message || "Message sent successfully!");
      queryClient.invalidateQueries({ queryKey: ['communication-history', id] });
      // Reset form
      setSubject("");
      setMessage("");
      setSelectedRecipients(["all"]);
      setSelectedEventId("");
      setSelectedTemplate("");
      setIsPreviewOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  const tournament = tournamentData?.data;
  const templates: Template[] = templatesData?.data || [];
  const history: Communication[] = historyData?.data || [];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject.replace('{{tournamentName}}', tournament?.name || ''));
      setMessage(template.message
        .replace(/\{\{tournamentName\}\}/g, tournament?.name || '')
        .replace(/\{\{tournamentLocation\}\}/g, tournament?.location || '')
        .replace(/\{\{tournamentDate\}\}/g, tournament?.startDate ? format(new Date(tournament.startDate), 'MMMM d, yyyy') : '')
      );
    }
  };

  const handlePreview = () => {
    const recipientType = selectedRecipients[0] || 'all';
    previewMutation.mutate({
      recipientType,
      recipientEventId: recipientType === 'event' ? selectedEventId : undefined,
    });
  };

  const handleSend = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const recipientType = selectedRecipients[0] || 'all';
    sendMutation.mutate({
      subject,
      message,
      recipientType,
      recipientEventId: recipientType === 'event' ? selectedEventId : undefined,
      template: selectedTemplate || 'custom',
    });
  };

  const handleRecipientChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedRecipients([type]); // Single selection for now
    }
  };

  if (tournamentLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tournament Not Found</h2>
            <Button onClick={() => navigate('/tournaments')}>Back to Tournaments</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-8">
          <div className="container mx-auto px-4">
            <Link
              to={`/tournaments/${id}`}
              className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tournament
            </Link>
            <h1 className="text-3xl font-display font-bold text-primary-foreground">
              Communications
            </h1>
            <p className="text-primary-foreground/70 mt-1">{tournament.name}</p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="compose" className="space-y-6">
            <TabsList className="glass-card p-1">
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Compose Tab */}
            <TabsContent value="compose">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recipients */}
                <Card className="glass-card-hover lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Recipients
                    </CardTitle>
                    <CardDescription>
                      Select who should receive this message
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(recipientTypeLabels).map(([type, label]) => (
                      <div key={type} className="flex items-start space-x-3">
                        <Checkbox
                          id={`recipient-${type}`}
                          checked={selectedRecipients.includes(type)}
                          onCheckedChange={(checked) => handleRecipientChange(type, !!checked)}
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`recipient-${type}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {label}
                          </Label>
                          {type === 'event' && selectedRecipients.includes('event') && (
                            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select event..." />
                              </SelectTrigger>
                              <SelectContent>
                                {tournament.events?.map((event: any) => (
                                  <SelectItem key={event._id} value={event._id}>
                                    {event.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={handlePreview}
                      disabled={previewMutation.isPending}
                    >
                      {previewMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Preview Recipients
                    </Button>
                  </CardContent>
                </Card>

                {/* Message Composer */}
                <Card className="glass-card-hover lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Message
                    </CardTitle>
                    <CardDescription>
                      Compose your message to participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label>Quick Templates</Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">Custom Message</SelectItem>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Enter email subject..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Type your message here... Use **bold** for emphasis and [link text](url) for links."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports basic formatting: **bold**, *italic*, [links](url)
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handlePreview}
                        disabled={previewMutation.isPending}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={handleSend}
                        disabled={sendMutation.isPending || !subject || !message}
                      >
                        {sendMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="glass-card-hover">
                <CardHeader>
                  <CardTitle>Message History</CardTitle>
                  <CardDescription>
                    View all messages sent to tournament participants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No messages sent yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((comm) => (
                        <div
                          key={comm._id}
                          className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{comm.subject}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {comm.message}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge variant="outline" className="text-xs">
                                  {recipientTypeLabels[comm.recipientType] || comm.recipientType}
                                  {comm.recipientEvent && `: ${comm.recipientEvent.name}`}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {comm.recipientCount} recipients
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge
                                variant={comm.status === 'sent' ? 'default' : 'destructive'}
                                className={cn(
                                  "mb-2",
                                  comm.status === 'sent' && "bg-green-500/10 text-green-600 border-green-500/20"
                                )}
                              >
                                {comm.status === 'sent' ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : comm.status === 'sending' ? (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {comm.status}
                              </Badge>
                              <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(comm.sentAt || comm.createdAt), 'MMM d, h:mm a')}
                              </p>
                              {comm.metadata && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {comm.metadata.successCount} sent
                                  {comm.metadata.failedCount > 0 && (
                                    <span className="text-destructive">
                                      , {comm.metadata.failedCount} failed
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recipient Preview</DialogTitle>
              <DialogDescription>
                Review who will receive this message
              </DialogDescription>
            </DialogHeader>
            
            {recipientPreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                  <span className="font-medium">Total Recipients</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {recipientPreview.count}
                  </Badge>
                </div>

                {recipientPreview.recipients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Sample Recipients:</Label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {recipientPreview.recipients.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                        >
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{r.name}</span>
                          <span className="text-muted-foreground">({r.email})</span>
                        </div>
                      ))}
                    </div>
                    {recipientPreview.hasMore && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... and {recipientPreview.count - recipientPreview.recipients.length} more
                      </p>
                    )}
                  </div>
                )}

                {recipientPreview.count === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recipients match the selected criteria</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending || !recipientPreview?.count}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send to {recipientPreview?.count || 0} Recipients
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TournamentCommunications;
