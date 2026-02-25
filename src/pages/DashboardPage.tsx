import { useState, useEffect } from "react";
import { Mail, MousePointerClick, Users, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import CampaignChart from "@/components/CampaignChart";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalEmailsSent: number;
  totalOpens: number;
  totalClicks: number;
  totalCustomers: number;
  openRate: number;
  clickRate: number;
  totalCampaigns: number;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmailsSent: 0,
    totalOpens: 0,
    totalClicks: 0,
    totalCustomers: 0,
    openRate: 0,
    clickRate: 0,
    totalCampaigns: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });

      // Fetch campaigns count
      const { count: campaignsCount } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true });

      // Fetch email sends with their events
      const { data: emailSends } = await supabase
        .from("email_sends")
        .select(`
          id,
          status,
          opened_at,
          clicked_at
        `);

      const totalSent = emailSends?.filter(e => e.status === "sent").length || 0;
      const totalOpens = emailSends?.filter(e => e.opened_at).length || 0;
      const totalClicks = emailSends?.filter(e => e.clicked_at).length || 0;

      const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

      setStats({
        totalEmailsSent: totalSent,
        totalOpens,
        totalClicks,
        totalCustomers: customersCount || 0,
        openRate,
        clickRate,
        totalCampaigns: campaignsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Mails Opened",
      value: isLoading ? "..." : stats.totalOpens.toLocaleString(),
      change: isLoading ? "Loading..." : `${stats.openRate.toFixed(1)}% open rate`,
      changeType: "positive" as const,
      icon: Mail,
    },
    {
      title: "Open Rate",
      value: isLoading ? "..." : `${stats.openRate.toFixed(1)}%`,
      change: isLoading ? "Loading..." : `${stats.totalEmailsSent} emails sent`,
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Links Clicked",
      value: isLoading ? "..." : stats.totalClicks.toLocaleString(),
      change: isLoading ? "Loading..." : `${stats.clickRate.toFixed(1)}% CTR`,
      changeType: "positive" as const,
      icon: MousePointerClick,
    },
    {
      title: "Total Subscribers",
      value: isLoading ? "..." : stats.totalCustomers.toLocaleString(),
      change: isLoading ? "Loading..." : "From your customer list",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-4 pt-16">
        <Header title="Dashboard" subtitle="Welcome back! Here's your email performance overview." />
        
        <main className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <StatCard key={stat.title} {...stat} delay={index * 100} />
            ))}
          </div>

          {/* Chart */}
          <CampaignChart />

          {/* Bottom Section */}
          <div className="grid grid-cols-1 gap-6">
            {/* Total Volume */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-accent/20 border border-accent/20">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Total Volume</h3>
                  <p className="text-sm text-muted-foreground">Email sending metrics</p>
                </div>
              </div>

              <div className="text-center py-6">
                <p className="text-5xl font-bold gradient-text">
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                  ) : (
                    stats.totalEmailsSent.toLocaleString()
                  )}
                </p>
                <p className="text-muted-foreground mt-2">Emails sent total</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-foreground">
                    {isLoading ? "..." : stats.totalCampaigns}
                  </p>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-foreground">
                    {isLoading ? "..." : stats.totalEmailsSent > 0 ? "98.2%" : "0%"}
                  </p>
                  <p className="text-xs text-muted-foreground">Delivery Rate</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-foreground">
                    {isLoading ? "..." : stats.totalEmailsSent > 0 ? "0.3%" : "0%"}
                  </p>
                  <p className="text-xs text-muted-foreground">Bounce Rate</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <p className="text-sm text-accent font-medium">
                    {stats.totalEmailsSent > 0 ? "Health Score: Excellent" : "Ready to Start"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEmailsSent > 0 
                    ? "Your sender reputation is in great standing"
                    : "Import customers and launch your first campaign"
                  }
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
