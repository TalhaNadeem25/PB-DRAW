import Layout from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import {
    Calendar,
    Check,
    Clock,
    Funnel,
    CircleNotch,
    MapPin,
    Chat,
    MagnifyingGlass,
    PaperPlaneTilt,
    Star,
    Trophy,
    UserPlus,
    Users,
    X
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

interface Player {
  _id: string;
  name: string;
  email: string;
  skillLevel: number;
  avatar?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
  };
  preferences?: {
    playingDays?: string[];
    partnerPreference?: string;
  };
  statistics?: {
    matchesPlayed: number;
    matchesWon: number;
    tournamentsPlayed: number;
  };
  hasRequestPending?: boolean;
  compatibilityScore?: number;
}

interface PartnerRequest {
  _id: string;
  sender: Player;
  receiver: Player;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  event?: {
    name: string;
    gameType: string;
  };
  tournament?: {
    name: string;
  };
}

const FindPartner = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'browse');
  
  // Browse state
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skillRange, setSkillRange] = useState([2.5, 5.0]);
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  
  // Request dialog
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Requests state
  const [receivedRequests, setReceivedRequests] = useState<PartnerRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<PartnerRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Fetch available players
  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/partners/players', {
        params: {
          skillMin: skillRange[0],
          skillMax: skillRange[1],
          city: cityFilter || undefined,
          state: stateFilter || undefined
        }
      });
      if (response.data.success) {
        setPlayers(response.data.players);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
      toast.error('Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch requests
  const fetchRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const [receivedRes, sentRes] = await Promise.all([
        api.get('/partners/requests/received'),
        api.get('/partners/requests/sent')
      ]);
      
      if (receivedRes.data.success) setReceivedRequests(receivedRes.data.requests);
      if (sentRes.data.success) setSentRequests(sentRes.data.requests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [skillRange, cityFilter, stateFilter]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  // Send partner request
  const handleSendRequest = async () => {
    if (!selectedPlayer) return;
    
    try {
      setIsSending(true);
      const response = await api.post('/partners/requests', {
        receiverId: selectedPlayer._id,
        message: requestMessage
      });
      
      if (response.data.success) {
        toast.success('Partner request sent!');
        setSelectedPlayer(null);
        setRequestMessage('');
        fetchPlayers(); // Refresh to update pending status
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setIsSending(false);
    }
  };

  // Respond to request
  const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const response = await api.put(`/partners/requests/${requestId}/respond`, { action });
      
      if (response.data.success) {
        toast.success(action === 'accept' ? 'Partner request accepted!' : 'Request declined');
        fetchRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to respond');
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await api.delete(`/partners/requests/${requestId}`);
      
      if (response.data.success) {
        toast.success('Request cancelled');
        fetchRequests();
        fetchPlayers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const getSkillBadgeColor = (level: number) => {
    if (level >= 4.5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level >= 4.0) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (level >= 3.5) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Compact header — no green hero */}
        <div className="border-b border-border/60 bg-card/50">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Find Your Perfect Partner</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
              Partner Matchmaking
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Connect with players at your skill level, send partner requests, and team up for doubles events.
            </p>
          </div>
        </div>

        {/* Tabs + content */}
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => {
              setActiveTab(v);
              setSearchParams({ tab: v });
            }}
            className="max-w-6xl mx-auto"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6 bg-muted/50 border border-border p-1.5 rounded-xl">
              <TabsTrigger value="browse" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all">
                <MagnifyingGlass className="w-4 h-4" />
                Browse Players
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2 relative rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all">
                <Chat className="w-4 h-4" />
                Requests
                {receivedRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-bold rounded-full flex items-center justify-center text-primary-foreground">
                    {receivedRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Browse Tab */}
            <TabsContent value="browse" className="space-y-6">
                {/* Filters */}
                <div className="glass-card-hover rounded-2xl p-6 animate-fade-in">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-6">
                    <Funnel className="w-5 h-5 text-primary" />
                    Filters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Skill Range */}
                      <div className="md:col-span-2 space-y-3">
                        <Label>Skill Level: {skillRange[0]} - {skillRange[1]}</Label>
                        <Slider
                          value={skillRange}
                          onValueChange={setSkillRange}
                          min={2.5}
                          max={5.0}
                          step={0.5}
                          className="py-2"
                        />
                      </div>
                      
                      {/* City */}
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          placeholder="Any city"
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                          className="glass"
                        />
                      </div>
                      
                      {/* State */}
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          placeholder="Any state"
                          value={stateFilter}
                          onChange={(e) => setStateFilter(e.target.value)}
                          className="glass"
                        />
                      </div>
                    </div>
                </div>

                {/* Players Grid */}
                {isLoading ? (
                  <div className="py-8">
                    <SkeletonGrid count={6} />
                  </div>
                ) : players.length === 0 ? (
                  <div className="glass-card-hover rounded-2xl p-8 text-center text-muted-foreground animate-fade-in">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-display font-bold text-lg mb-2 text-foreground">No players found</h3>
                    <p>Try adjusting your filters or check back later.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player, index) => (
                      <div
                        key={player._id}
                        className={cn(
                          "glass-card-hover rounded-2xl p-6 group animate-fade-in",
                          player.hasRequestPending && "ring-2 ring-primary/50"
                        )}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="w-16 h-16 border-2 border-border">
                              <AvatarImage src={player.avatar} />
                              <AvatarFallback className="bg-hero-gradient text-primary-foreground text-lg font-bold">
                                {player.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-display font-bold text-lg truncate">{player.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={getSkillBadgeColor(player.skillLevel)}>
                                  <Star className="w-3 h-3 mr-1" />
                                  {player.skillLevel}
                                </Badge>
                                {player.compatibilityScore !== undefined && (
                                  <span className={cn("text-xs font-medium", getCompatibilityColor(player.compatibilityScore))}>
                                    {player.compatibilityScore}% match
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Location */}
                          {(player.location?.city || player.location?.state) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <MapPin className="w-4 h-4" />
                              {[player.location.city, player.location.state].filter(Boolean).join(', ')}
                            </div>
                          )}

                          {/* Bio */}
                          {player.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {player.bio}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                            {player.statistics && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {player.statistics.matchesWon}/{player.statistics.matchesPlayed} wins
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {player.statistics.tournamentsPlayed} events
                                </span>
                              </>
                            )}
                          </div>

                          {/* Playing Days */}
                          {player.preferences?.playingDays && player.preferences.playingDays.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {player.preferences.playingDays.map((day) => (
                                <Badge key={day} variant="secondary" className="text-xs">
                                  {day.slice(0, 3)}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Action */}
                          {player.hasRequestPending ? (
                            <Button variant="outline" className="w-full" disabled>
                              <Clock className="w-4 h-4 mr-2" />
                              Request Pending
                            </Button>
                          ) : (
                            <Button 
                              className="w-full group-hover:shadow-glow transition-shadow"
                              onClick={() => setSelectedPlayer(player)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Send Partner Request
                            </Button>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Received Requests */}
                  <div className="glass-card-hover rounded-2xl p-6 animate-fade-in">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-6">
                      <Chat className="w-5 h-5 text-primary" />
                      Received Requests
                      {receivedRequests.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">{receivedRequests.length}</Badge>
                      )}
                    </h3>
                    <div>
                      {isLoadingRequests ? (
                        <div className="flex items-center justify-center py-8">
                          <CircleNotch className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : receivedRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Chat className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p>No pending requests</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {receivedRequests.map((request) => (
                              <div 
                                key={request._id}
                                className="p-4 rounded-xl bg-accent/30 border border-border/50"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={request.sender.avatar} />
                                    <AvatarFallback className="bg-hero-gradient text-primary-foreground">
                                      {request.sender.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">{request.sender.name}</h4>
                                      <Badge variant="outline" className={getSkillBadgeColor(request.sender.skillLevel)}>
                                        {request.sender.skillLevel}
                                      </Badge>
                                    </div>
                                    {request.message && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        "{request.message}"
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                  <Button 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => handleRespondToRequest(request._id, 'accept')}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleRespondToRequest(request._id, 'decline')}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>

                  {/* Sent Requests */}
                  <div className="glass-card-hover rounded-2xl p-6 animate-fade-in">
                    <h3 className="font-display font-bold text-lg flex items-center gap-2 mb-6">
                      <PaperPlaneTilt className="w-5 h-5 text-primary" />
                      Sent Requests
                    </h3>
                    <div>
                      {isLoadingRequests ? (
                        <div className="flex items-center justify-center py-8">
                          <CircleNotch className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : sentRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <PaperPlaneTilt className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p>No sent requests</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4">
                            {sentRequests.map((request) => (
                              <div 
                                key={request._id}
                                className="p-4 rounded-xl bg-accent/30 border border-border/50"
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={request.receiver.avatar} />
                                    <AvatarFallback className="bg-hero-gradient text-primary-foreground">
                                      {request.receiver.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium">{request.receiver.name}</h4>
                                      <Badge variant="outline" className={getSkillBadgeColor(request.receiver.skillLevel)}>
                                        {request.receiver.skillLevel}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant={request.status === 'pending' ? 'secondary' : request.status === 'accepted' ? 'default' : 'destructive'}
                                        className="text-xs"
                                      >
                                        {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                        {request.status === 'accepted' && <Check className="w-3 h-3 mr-1" />}
                                        {request.status === 'declined' && <X className="w-3 h-3 mr-1" />}
                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {request.status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="w-full mt-3 text-destructive hover:text-destructive"
                                    onClick={() => handleCancelRequest(request._id)}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel Request
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
        </div>
      </div>

      {/* Send Request Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-md rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Send Partner Request
            </DialogTitle>
            <DialogDescription>
              Invite {selectedPlayer?.name} to be your partner for doubles events.
            </DialogDescription>
          </DialogHeader>

          {selectedPlayer && (
            <div className="space-y-4">
              {/* Player Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/30">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={selectedPlayer.avatar} />
                  <AvatarFallback className="bg-hero-gradient text-primary-foreground text-lg">
                    {selectedPlayer.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedPlayer.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getSkillBadgeColor(selectedPlayer.skillLevel)}>
                      <Star className="w-3 h-3 mr-1" />
                      {selectedPlayer.skillLevel} Skill
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Introduce yourself or mention which events you'd like to play together..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="glass min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {requestMessage.length}/500
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendRequest} disabled={isSending}>
              {isSending ? (
                <>
                  <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PaperPlaneTilt className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default FindPartner;
