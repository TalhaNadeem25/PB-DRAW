import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsAPI, tournamentAPI } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { CurrencyDollar, FileXls, FileText, TrendUp, Trophy, Users } from '@phosphor-icons/react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch user's tournaments for the filter
  const { data: tournamentsData } = useQuery({
    queryKey: ['my-tournaments'],
    queryFn: async () => {
      const response = await tournamentAPI.getAll({ status: undefined });
      return response;
    },
    enabled: !!user
  });

  // Filter tournaments by organizer
  const myTournaments = tournamentsData?.data?.filter(
    (t: any) => t.organizer._id === user?._id || t.organizer === user?._id
  ) || [];

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', user?._id, selectedTournament, startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (selectedTournament !== 'all') params.tournamentId = selectedTournament;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await analyticsAPI.getOrganizationAnalytics(user!._id, params);
      return response.data;
    },
    enabled: !!user?._id
  });

  // Export handlers
  const handleExportCSV = async () => {
    try {
      const params: any = {};
      if (selectedTournament !== 'all') params.tournamentId = selectedTournament;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const blob = await analyticsAPI.exportCSV(user!._id, params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const params: any = {};
      if (selectedTournament !== 'all') params.tournamentId = selectedTournament;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const blob = await analyticsAPI.exportPDF(user!._id, params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Prepare chart data
  const skillLevelChartData = analyticsData?.demographics?.skillLevels?.map((item: any) => ({
    name: `Level ${item.skillLevel}`,
    value: item.count,
    percentage: item.percentage
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <div className="border-b border-border/60 bg-card/50 -mx-4 px-4 py-6 mb-8 rounded-b-none animate-pulse">
             <Skeleton className="h-8 w-64 mb-2" />
             <Skeleton className="h-4 w-48" />
          </div>
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          {/* Compact top bar — no green hero */}
          <div className="border-b border-border/60 bg-card/50 -mx-4 px-4 py-6 mb-8 rounded-b-none">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">Track your tournament performance and revenue</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <FileXls className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button onClick={handleExportPDF} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <Card className="mb-8 glass-card rounded-2xl border-border/50">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Customize your analytics view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tournament</label>
                  <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Tournaments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tournaments</SelectItem>
                      {myTournaments.map((tournament: any) => (
                        <SelectItem key={tournament._id} value={tournament._id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card-hover rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <CurrencyDollar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold">
                  ${analyticsData?.revenue?.total?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Net: ${analyticsData?.revenue?.netRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Fees: ${analyticsData?.revenue?.platformFees?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card-hover rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                <Trophy className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold">
                  {analyticsData?.summary?.totalTournaments || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total Events: {analyticsData?.summary?.totalEvents || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card-hover rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Participants</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold">
                  {analyticsData?.summary?.uniqueParticipants || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Unique players across all events
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card-hover rounded-2xl border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Fill Rate</CardTitle>
                <TrendUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold">
                  {analyticsData?.registrations?.fillRate?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Completion: {analyticsData?.registrations?.completionRate?.toFixed(1) || '0.0'}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="revenue" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="registrations">Registrations</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="popularity">Event Popularity</TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Revenue by Event</CardTitle>
                  <CardDescription>Total revenue generated per event</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.revenue?.perEvent?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analyticsData.revenue.perEvent}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registrations Tab */}
            <TabsContent value="registrations">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Registration Metrics by Event</CardTitle>
                  <CardDescription>Fill rate and completion rate per event</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.registrations?.perEvent?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analyticsData.registrations.perEvent}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="eventName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="fillRate" fill="#82ca9d" name="Fill Rate (%)" />
                        <Bar dataKey="completionRate" fill="#ffc658" name="Completion Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      No registration data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Demographics Tab */}
            <TabsContent value="demographics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Skill Level Distribution</CardTitle>
                    <CardDescription>Player skill levels across events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {skillLevelChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={skillLevelChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {skillLevelChartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No skill level data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Top 10 Locations</CardTitle>
                    <CardDescription>Participant locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analyticsData?.demographics?.locations?.length > 0 ? (
                      <div className="space-y-3">
                        {analyticsData.demographics.locations.map((location: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {location.city ? `${location.city}, ` : ''}{location.state}
                              </div>
                              <Progress
                                value={(location.count / analyticsData.demographics.locations[0].count) * 100}
                                className="h-2 mt-1"
                              />
                            </div>
                            <div className="ml-4 text-sm font-semibold">
                              {location.count}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No location data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Event Popularity Tab */}
            <TabsContent value="popularity">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Event Popularity</CardTitle>
                  <CardDescription>Registration count and fill rate by event</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.eventPopularity?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analyticsData.eventPopularity.map((event: any) => (
                        <Card key={event.eventId} className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{event.eventName}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Registrations</span>
                              <span className="font-semibold">
                                {event.registrations}/{event.maxTeams}
                              </span>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-muted-foreground">Fill Rate</span>
                                <span className="text-sm font-semibold">
                                  {event.fillRate.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={event.fillRate} className="h-2" />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm text-muted-foreground">Revenue</span>
                              <span className="font-semibold text-green-600">
                                ${event.revenue.toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      No event popularity data available
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

export default AnalyticsDashboard;
