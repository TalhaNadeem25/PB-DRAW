import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Save, Loader2, Mail, Phone, Award } from "lucide-react";
import { authAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    skillLevel: user?.skillLevel?.toString() || "3.0",
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => authAPI.updateProfile(data),
    onSuccess: (response) => {
      updateUser(response.data);
      setIsEditing(false);
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
    });
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

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-2">
              My Profile
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Manage your account information
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and preferences
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 pb-6 border-b">
                    <div className="w-20 h-20 rounded-full bg-hero-gradient flex items-center justify-center">
                      <User className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{user.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="555-0123"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{user.phone || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  {/* Skill Level */}
                  <div className="space-y-2">
                    <Label htmlFor="skillLevel">Skill Level</Label>
                    {isEditing ? (
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
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span>{user.skillLevel || "Not set"}</span>
                      </div>
                    )}
                  </div>

                  {/* Role (read-only) */}
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
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
                          setIsEditing(false);
                          setFormData({
                            name: user?.name || "",
                            email: user?.email || "",
                            phone: user?.phone || "",
                            skillLevel: user?.skillLevel?.toString() || "3.0",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;

