import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Calendar, Lock } from "lucide-react";
import { memberApi } from "@/lib/api";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  memberId: string;
}

const MemberProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    memberId: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const response = await memberApi.getProfile();
      setProfileData(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [toast]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    try {
      await memberApi.updateProfile(profileData);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "New password and confirmation do not match",
          variant: "destructive",
        });
        return;
      }
      if (passwordData.newPassword.length < 8) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }

      await memberApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated",
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className={isEditing ? "" : "bg-muted"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className={`pl-10 ${isEditing ? "" : "bg-muted"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className={`pl-10 ${isEditing ? "" : "bg-muted"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className={`pl-10 ${isEditing ? "" : "bg-muted"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="dob"
                          type="date"
                          value={profileData.dob ? profileData.dob.split('T')[0] : ""}
                          onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                          className={`pl-10 ${isEditing ? "" : "bg-muted"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Member ID</Label>
                      <Input
                        value={profileData.memberId}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save Changes</Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <div className="bg-muted rounded px-3 py-2">{profileData.name}</div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <div className="bg-muted rounded px-3 py-2">{profileData.email}</div>
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <div className="bg-muted rounded px-3 py-2">{profileData.phone}</div>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <div className="bg-muted rounded px-3 py-2">{profileData.address}</div>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <div className="bg-muted rounded px-3 py-2">{profileData.dob ? profileData.dob.split('T')[0] : ""}</div>
                    </div>
                    <div>
                      <Label>Member ID</Label>
                      <div className="bg-muted rounded px-3 py-2">{profileData.memberId}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MemberProfile;
