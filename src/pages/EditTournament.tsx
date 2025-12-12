import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch tournament data
  const { data, isLoading, error } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentAPI.getById(id!),
    enabled: !!id,
  });

  const tournament = data?.data;

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(128);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [status, setStatus] = useState("open");

  // Populate form when tournament data loads
  useEffect(() => {
    if (tournament) {
      setName(tournament.name || "");
      setLocation(tournament.location || "");
      setAddress(tournament.address || "");
      setDescription(tournament.description || "");
      setMaxPlayers(tournament.maxPlayers || 128);
      setStartDate(tournament.startDate ? new Date(tournament.startDate) : undefined);
      setEndDate(tournament.endDate ? new Date(tournament.endDate) : undefined);
      setRegistrationDeadline(tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : undefined);
      setStatus(tournament.status || "open");
    }
  }, [tournament]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => tournamentAPI.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success("Tournament updated successfully!");
      navigate(`/tournaments/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update tournament");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !location || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateMutation.mutate({
      name,
      description,
      location,
      address,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      registrationDeadline: registrationDeadline?.toISOString(),
      maxPlayers,
      status,
    });
  };

  // Check authorization - handle both organizerId (string) and organizer._id (populated object)
  const isOrganizer = tournament && user && (
    tournament.organizerId === user._id || 
    tournament.organizer?._id === user._id ||
    user.role === 'admin'
  );
  
  if (tournament && user && !isOrganizer) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Unauthorized</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to edit this tournament.
              </p>
              <Button asChild>
                <a href={`/tournaments/${id}`}>Back to Tournament</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !tournament) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Tournament Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The tournament you're looking for doesn't exist.
              </p>
              <Button asChild>
                <a href="/tournaments">Back to Tournaments</a>
              </Button>
            </CardContent>
          </Card>
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
            <Button
              variant="ghost"
              onClick={() => navigate(`/tournaments/${id}`)}
              className="mb-6 text-primary-foreground/80 hover:text-primary-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </Button>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
              Edit Tournament
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Update tournament information
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Details</CardTitle>
                  <CardDescription>
                    Update the basic information about your tournament
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tournament Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location">Venue Name *</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxPlayers">Max Players *</Label>
                      <Input
                        id="maxPlayers"
                        type="number"
                        min="4"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 128)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dates</CardTitle>
                  <CardDescription>
                    Update tournament dates and registration deadline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Registration Deadline</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !registrationDeadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {registrationDeadline
                              ? format(registrationDeadline, "PPP")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={registrationDeadline}
                            onSelect={setRegistrationDeadline}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/tournaments/${id}`)}
                >
                  Cancel
                </Button>
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditTournament;

