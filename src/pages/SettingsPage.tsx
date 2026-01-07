import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Key, Trash2, Camera, Loader2, User } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, username")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setAvatarUrl(data.avatar_url);
        setUsername(data.username || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsSavingUsername(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Username updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update username");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete user data from profiles
      await supabase.from("profiles").delete().eq("id", user.id);
      
      // Sign out
      await supabase.auth.signOut();
      
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("campaign-images")
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-4 pt-16">
        <Header title="Settings" subtitle="Manage your account preferences" />
        
        <main className="p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Theme Toggle */}
            <div className="glass-card p-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {theme === "dark" ? (
                    <div className="p-3 rounded-lg bg-primary/20">
                      <Moon size={24} className="text-primary" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-yellow-500/20">
                      <Sun size={24} className="text-yellow-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
                    <p className="text-sm text-muted-foreground">
                      {theme === "dark" ? "Dark mode is enabled" : "Light mode is enabled"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === "light"}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>

            {/* Profile Picture */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Camera size={20} className="text-primary" />
                Profile Picture
              </h3>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-muted-foreground" />
                    )}
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    Upload New Picture
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" />
                Username (Sender Name)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This name will appear as the sender name in all your emails.
              </p>
              
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="gradient"
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername}
                  className="gap-2"
                >
                  {isSavingUsername ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Key size={20} className="text-primary" />
                Change Password
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </div>

            {/* Delete Account */}
            <div className="glass-card p-6 border-destructive/30 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Trash2 size={20} className="text-destructive" />
                Delete Account
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 size={16} />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isDeletingAccount}
                    >
                      {isDeletingAccount ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
