import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Users,
  Trophy,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Target,
  Edit2,
  Trash2,
  UserPlus,
  TrendingUp,
  Mail,
  Check,
  X,
} from "lucide-react";
import { teamAPI, invitationAPI } from "@/services/api";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Teams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editedTeamName, setEditedTeamName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerName, setPartnerName] = useState("");

  // Fetch user's teams
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['myTeams'],
    queryFn: () => teamAPI.getMyTeams(),
    enabled: !!user,
  });

  // Fetch received invitations
  const { data: invitationsData } = useQuery({
    queryKey: ['receivedInvitations'],
    queryFn: () => invitationAPI.getReceived(),
    enabled: !!user,
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) => teamAPI.update(data.id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success("Team updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update team");
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => teamAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success("Team deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedTeam(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete team");
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: (data: { teamId: string; inviteeEmail: string; inviteeName?: string }) =>
      invitationAPI.send(data.teamId, {
        inviteeEmail: data.inviteeEmail,
        inviteeName: data.inviteeName,
        message: `${user?.name} has invited you to join their team`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success("Invitation sent successfully!");
      setIsInviteDialogOpen(false);
      setPartnerEmail("");
      setPartnerName("");
      setSelectedTeam(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: (id: string) => invitationAPI.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      toast.success("Invitation accepted! You're now part of the team.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to accept invitation");
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: (id: string) => invitationAPI.decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivedInvitations'] });
      toast.success("Invitation declined");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to decline invitation");
    },
  });

  const teams = teamsData?.data || [];
  const invitations = invitationsData?.data || [];

  const handleEditClick = (team: any) => {
    setSelectedTeam(team);
    setEditedTeamName(team.name);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (team: any) => {
    setSelectedTeam(team);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateTeam = () => {
    if (!editedTeamName.trim()) {
      toast.error("Team name cannot be empty");
      return;
    }

    if (selectedTeam) {
      updateTeamMutation.mutate({
        id: selectedTeam._id,
        name: editedTeamName.trim(),
      });
    }
  };

  const handleDeleteTeam = () => {
    if (selectedTeam) {
      deleteTeamMutation.mutate(selectedTeam._id);
    }
  };

  const handleInviteClick = (team: any) => {
    setSelectedTeam(team);
    setIsInviteDialogOpen(true);
  };

  const handleSendInvitation = () => {
    if (!partnerEmail.trim()) {
      toast.error("Please enter partner's email");
      return;
    }

    if (selectedTeam) {
      sendInvitationMutation.mutate({
        teamId: selectedTeam._id,
        inviteeEmail: partnerEmail.trim(),
        inviteeName: partnerName.trim() || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your teams...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
                My Teams
              </h1>
              <p className="text-primary-foreground/80 text-lg max-w-2xl">
                Manage your teams and view your tournament registrations
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Pending Invitations
                  <Badge variant="default" className="ml-auto">{invitations.length}</Badge>
                </CardTitle>
                <CardDescription>You have been invited to join the following teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((invitation: any) => {
                    const team = invitation.team;
                    const event = team?.event;
                    const tournament = event?.tournament;

                    return (
                      <div
                        key={invitation._id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{team?.name}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>From: {invitation.inviter?.name}</p>
                            {event && <p className="flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              {event.name} • {tournament?.name}
                            </p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptInvitationMutation.mutate(invitation._id)}
                            disabled={acceptInvitationMutation.isPending}
                          >
                            {acceptInvitationMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineInvitationMutation.mutate(invitation._id)}
                            disabled={declineInvitationMutation.isPending}
                          >
                            {declineInvitationMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teams List */}
          {teams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Teams Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't created any teams yet. Register for a tournament to get started!
                </p>
                <Button onClick={() => navigate('/tournaments')}>
                  Browse Tournaments
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team: any) => {
                const event = team.event;
                const tournament = event?.tournament;
                const needsPartner = event?.format !== 'singles' && team.players.length < 2;

                return (
                  <Card key={team._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-primary" />
                            {team.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="capitalize">
                              {event?.format?.replace('-', ' ')}
                            </Badge>
                            {team.pool && (
                              <Badge variant="outline">{team.pool.name}</Badge>
                            )}
                            {needsPartner && (
                              <Badge variant="destructive" className="text-xs">
                                Needs Partner
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {tournament && (
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Trophy className="w-4 h-4" />
                            {tournament.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            {tournament.location}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(tournament.startDate), 'MMM dd, yyyy')}
                          </div>
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Event Details */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Event</Label>
                        <p className="font-medium">{event?.name}</p>
                      </div>

                      {/* Team Members */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Team Members</Label>
                        <div className="space-y-1 mt-1">
                          {team.players.map((player: any) => (
                            <div key={player._id} className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {player.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span>{player.name}</span>
                              {player._id === user?.id && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </div>
                          ))}
                          {needsPartner && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <UserPlus className="w-3 h-3" />
                              </div>
                              <span className="italic">Partner needed</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Team Stats */}
                      {(team.stats.wins > 0 || team.stats.losses > 0) && (
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Record
                          </Label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Wins</p>
                              <p className="font-bold text-green-600">{team.stats.wins}</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Losses</p>
                              <p className="font-bold text-red-600">{team.stats.losses}</p>
                            </div>
                            <div className="text-center p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Diff</p>
                              <p className="font-bold">{team.stats.pointDifferential}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2 pt-2 border-t">
                        {needsPartner && (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => handleInviteClick(team)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Partner
                          </Button>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditClick(team)}
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(team)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Team Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>Update your team name</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={editedTeamName}
                  onChange={(e) => setEditedTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTeam}
                disabled={!editedTeamName.trim() || updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Team"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Partner Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Invite Partner to {selectedTeam?.name}
              </DialogTitle>
              <DialogDescription>
                Send an invitation to your partner to join this team
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="partnerName">Partner Name (Optional)</Label>
                <Input
                  id="partnerName"
                  placeholder="e.g., John Smith"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="partnerEmail">Partner Email *</Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your partner will receive an invitation to join this team
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvitation}
                disabled={!partnerEmail.trim() || sendInvitationMutation.isPending}
              >
                {sendInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedTeam?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTeam}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTeamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Team"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Teams;
