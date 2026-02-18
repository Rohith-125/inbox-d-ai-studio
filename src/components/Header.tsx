import { useState, useEffect } from "react";
import { Bell, Search, LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface RecentSend {
  id: string;
  campaign_name: string;
  sent_at: string;
  status: string;
}

const Header = ({ title, subtitle }: HeaderProps) => {
  const navigate = useNavigate();
  const [recentSends, setRecentSends] = useState<RecentSend[]>([]);

  useEffect(() => {
    fetchRecentSends();
  }, []);

  const fetchRecentSends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, sent_at, status")
        .eq("user_id", user.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSends((data || []).map(c => ({
        id: c.id,
        campaign_name: c.name,
        sent_at: c.sent_at || "",
        status: c.status || "sent",
      })));
    } catch (err) {
      console.error("Failed to fetch recent sends:", err);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="w-64 pl-10 bg-secondary/50 border-border/50"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {recentSends.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b border-border/50">
                <h4 className="text-sm font-semibold text-foreground">Recent Sends</h4>
              </div>
              <ScrollArea className="max-h-64">
                {recentSends.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No recent sends</p>
                ) : (
                  recentSends.map((send) => (
                    <div key={send.id} className="px-3 py-2.5 border-b border-border/30 last:border-0 hover:bg-secondary/50 transition-colors">
                      <p className="text-sm font-medium text-foreground truncate">{send.campaign_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sent {send.sent_at ? new Date(send.sent_at).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-3 pl-4 border-l border-border/50">
            <button
              onClick={() => navigate("/settings")}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <User size={18} className="text-primary-foreground" />
            </button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
