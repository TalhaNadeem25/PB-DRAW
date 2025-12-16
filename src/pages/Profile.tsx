import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Save, Loader2, Mail, Phone, Award, MapPin, Calendar, Trophy, Target, Medal } from "lucide-react";
import { authAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    skillLevel: user?.skillLevel?.toString() || "3.0",
    bio: user?.bio || "",
    city: user?.location?.city || "",
    state: user?.location?.state || "",
    playingDays: user?.preferences?.playingDays || [],
    partnerPreference: user?.preferences?.partnerPreference || "either",
  });

  // Fetch user stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authAPI.getStats(),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: formData.name,
      phone: formData.phone || undefined,
      skillLevel: parseFloat(formData.skillLevel),
      bio: formData.bio || undefined,
      location: {
        city: formData.city || undefined,
        state: formData.state || undefined,
      },
      preferences: {
        playingDays: formData.playingDays,
        partnerPreference: formData.partnerPreference,
      },
    });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      playingDays: prev.playingDays.includes(day)
        ? prev.playingDays.filter(d => d !== day)
        : [...prev.playingDays, day]
    }));
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Please log in</h2>
              <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const stats = statsData?.data?.statistics || user.statistics || {
    matchesPlayed: 0,
    matchesWon: 0,
    tournamentsPlayed: 0,
    goldMedals: 0,
    silverMedals: 0,
    bronzeMedals: 0,
  };

  const winRate = stats.matchesPlayed > 0
    ? ((stats.matchesWon / stats.matchesPlayed) * 100).toFixed(1)
    : 0;

  const tournaments = statsData?.data?.tournaments || [];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
                  {user.name}
                </h1>
                <div className="flex items-center gap-4 text-primary-foreground/80">
                  <span className="capitalize">{user.role}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Skill Level {user.skillLevel}
                  </span>
                  {user.location?.city && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {user.location.city}{user.location.state && `, ${user.location.state}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              <TabsTrigger value="history">Tournament History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Match Record</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.matchesWon} - {stats.matchesPlayed - stats.matchesWon}</div>
                    <p className="text-xs text-muted-foreground">
                      {winRate}% win rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.tournamentsPlayed}</div>
                    <p className="text-xs text-muted-foreground">
                      tournaments played
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Medals</CardTitle>
                    <Medal className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-600">{stats.goldMedals}</div>
                        <div className="text-xs text-muted-foreground">Gold</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-400">{stats.silverMedals}</div>
                        <div className="text-xs text-muted-foreground">Silver</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{stats.bronzeMedals}</div>
                        <div className="text-xs text-muted-foreground">Bronze</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bio & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user.bio ? (
                      <p className="text-muted-foreground">{user.bio}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No bio yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Partner Status</Label>
                      <p className="text-muted-foreground capitalize">
                        {user.preferences?.partnerPreference === 'looking' && 'Looking for partner'}
                        {user.preferences?.partnerPreference === 'have-partner' && 'Have partner'}
                        {user.preferences?.partnerPreference === 'either' && 'Open to either'}
                      </p>
                    </div>
                    {user.preferences?.playingDays && user.preferences.playingDays.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Preferred Playing Days</Label>
                        <p className="text-muted-foreground">
                          {user.preferences.playingDays.join(', ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Edit Profile Tab */}
            <TabsContent value="edit">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={formData.email}
                            disabled
                            className="bg-muted"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="555-0123"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="skillLevel">Skill Level *</Label>
                          <Select
                            value={formData.skillLevel}
                            onValueChange={(value) => setFormData({ ...formData, skillLevel: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2.5">2.5</SelectItem>
                              <SelectItem value="3.0">3.0</SelectItem>
                              <SelectItem value="3.5">3.5</SelectItem>
                              <SelectItem value="4.0">4.0</SelectItem>
                              <SelectItem value="4.5">4.5</SelectItem>
                              <SelectItem value="5.0">5.0</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell others about yourself..."
                          rows={4}
                          maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Dallas"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="TX"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Preferences</h3>

                      <div className="space-y-2">
                        <Label>Partner Status</Label>
                        <Select
                          value={formData.partnerPreference}
                          onValueChange={(value) => setFormData({ ...formData, partnerPreference: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="looking">Looking for partner</SelectItem>
                            <SelectItem value="have-partner">Have partner</SelectItem>
                            <SelectItem value="either">Open to either</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Playing Days</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={`day-${day}`}
                                checked={formData.playingDays.includes(day)}
                                onCheckedChange={() => toggleDay(day)}
                              />
                              <label
                                htmlFor={`day-${day}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {day.substring(0, 3)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            name: user?.name || "",
                            email: user?.email || "",
                            phone: user?.phone || "",
                            skillLevel: user?.skillLevel?.toString() || "3.0",
                            bio: user?.bio || "",
                            city: user?.location?.city || "",
                            state: user?.location?.state || "",
                            playingDays: user?.preferences?.playingDays || [],
                            partnerPreference: user?.preferences?.partnerPreference || "either",
                          });
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tournament History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament History</CardTitle>
                  <CardDescription>Your past tournaments and performances</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : tournaments.length > 0 ? (
                    <div className="space-y-4">
                      {tournaments.map((tournament: any) => (
                        <div
                          key={tournament._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/tournaments/${tournament._id}`)}
                        >
                          <div>
                            <h3 className="font-semibold">{tournament.name}</h3>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(tournament.startDate).toLocaleDateString()}
                              </span>
                              {tournament.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {tournament.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                            ${tournament.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                          `}>
                            {tournament.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No tournament history yet</p>
                      <p className="text-sm mt-1">Join a tournament to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
