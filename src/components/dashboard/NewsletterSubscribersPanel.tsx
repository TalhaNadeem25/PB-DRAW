import { useQuery } from "@tanstack/react-query";
import { newsletterAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Envelope, CircleNotch } from "@phosphor-icons/react";
import { format } from "date-fns";

const NewsletterSubscribersPanel = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: newsletterAPI.getSubscribers,
  });

  const subscribers: { _id: string; email: string; subscribedAt: string }[] = data?.data || [];

  return (
    <Card className="glass-card rounded-2xl border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Envelope className="h-5 w-5 text-primary" />
            <CardTitle>Newsletter Subscribers</CardTitle>
          </div>
          {!isLoading && (
            <Badge variant="secondary" className="font-mono">
              {subscribers.length} total
            </Badge>
          )}
        </div>
        <CardDescription>All emails collected from the footer subscription form</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <CircleNotch className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive text-center py-4">Failed to load subscribers</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No subscribers yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left pb-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left pb-3 font-semibold text-muted-foreground">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {subscribers.map((sub, i) => (
                  <tr key={sub._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 pr-4 text-muted-foreground font-mono">{i + 1}</td>
                    <td className="py-3 pr-4 font-medium">{sub.email}</td>
                    <td className="py-3 text-muted-foreground">
                      {format(new Date(sub.subscribedAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterSubscribersPanel;
