import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminAPI } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { BellRinging, CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";

interface UserResult {
  _id: string;
  name: string;
  email: string;
}

const AdminNotificationPanel = () => {
  const [target, setTarget] = useState<"single" | "all">("single");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<("email" | "push")[]>(["email", "push"]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["admin-user-search", search],
    queryFn: () => adminAPI.searchUsers(search),
    enabled: target === "single" && search.trim().length >= 2 && !selectedUser,
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      adminAPI.sendNotification({
        target,
        userId: target === "single" ? selectedUser?._id : undefined,
        title,
        message,
        channels,
      }),
    onSuccess: (data) => {
      toast.success(data.message || "Notification sent");
      setTitle("");
      setMessage("");
      setSelectedUser(null);
      setSearch("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send notification");
    },
  });

  const handleChannelChange = (channel: "email" | "push", checked: boolean) => {
    setChannels((prev) => (checked ? [...prev, channel] : prev.filter((c) => c !== channel)));
  };

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    channels.length > 0 &&
    (target === "all" || !!selectedUser);

  const handleSendClick = () => {
    if (!canSend) {
      toast.error("Fill in a title, message, channel, and recipient first");
      return;
    }
    if (target === "all") {
      setConfirmOpen(true);
      return;
    }
    sendMutation.mutate();
  };

  const users: UserResult[] = searchResults?.data || [];

  return (
    <Card className="glass-card rounded-2xl border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BellRinging className="h-5 w-5 text-primary" />
          <CardTitle>Send Notification</CardTitle>
        </div>
        <CardDescription>Platform-wide announcements — app updates, maintenance notices, re-engagement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Send to</Label>
          <RadioGroup
            value={target}
            onValueChange={(v) => {
              setTarget(v as "single" | "all");
              setSelectedUser(null);
              setSearch("");
            }}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="single" id="target-single" />
              <Label htmlFor="target-single" className="font-normal cursor-pointer">One person</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="all" id="target-all" />
              <Label htmlFor="target-all" className="font-normal cursor-pointer">Every user</Label>
            </div>
          </RadioGroup>
        </div>

        {target === "single" && (
          <div className="space-y-2">
            <Label htmlFor="admin-notif-search">Recipient</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-notif-search"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                {isSearching && (
                  <CircleNotch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {users.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-border/50 bg-popover shadow-md max-h-56 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedUser(u);
                          setSearch("");
                        }}
                      >
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-notif-title">Title *</Label>
          <Input
            id="admin-notif-title"
            placeholder="e.g. New feature: live scoring"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-notif-message">Message *</Label>
          <Textarea
            id="admin-notif-message"
            placeholder="Type your announcement here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Send via *</Label>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-channel-email"
                checked={channels.includes("email")}
                onCheckedChange={(checked) => handleChannelChange("email", !!checked)}
              />
              <Label htmlFor="admin-channel-email" className="font-normal cursor-pointer">Email</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-channel-push"
                checked={channels.includes("push")}
                onCheckedChange={(checked) => handleChannelChange("push", !!checked)}
              />
              <Label htmlFor="admin-channel-push" className="font-normal cursor-pointer">Push notification</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSendClick} disabled={!canSend || sendMutation.isPending}>
            {sendMutation.isPending ? (
              <CircleNotch className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BellRinging className="w-4 h-4 mr-2" />
            )}
            Send
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send to every user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send "{title}" to every registered user on PB Draw via {channels.join(" and ")}. This can't be undone once sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                sendMutation.mutate();
              }}
            >
              Send to everyone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AdminNotificationPanel;
