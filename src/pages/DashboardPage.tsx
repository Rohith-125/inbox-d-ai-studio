import { Mail, MousePointerClick, Users, TrendingUp, Zap, BarChart3 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import CampaignChart from "@/components/CampaignChart";

const DashboardPage = () => {
  const stats = [
    {
      title: "Total Mails Opened",
      value: "24,847",
      change: "+12.5% from last month",
      changeType: "positive" as const,
      icon: Mail,
    },
    {
      title: "Open Rate",
      value: "68.4%",
      change: "+4.2% from last month",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Links Clicked",
      value: "8,291",
      change: "33.4% CTR",
      changeType: "positive" as const,
      icon: MousePointerClick,
    },
    {
      title: "New Subscribers",
      value: "1,429",
      change: "+18.7% this week",
      changeType: "positive" as const,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title="Dashboard" subtitle="Welcome back! Here's your email performance overview." />
        
        <main className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.title} {...stat} delay={index * 100} />
            ))}
          </div>

          {/* Chart */}
          <CampaignChart />

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Conversion Summary */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">AI Conversion Summary</h3>
                  <p className="text-sm text-muted-foreground">Powered by machine learning</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Predicted Conversion Rate</p>
                    <p className="text-2xl font-bold text-foreground">4.8%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-accent">+0.6% vs baseline</p>
                    <p className="text-xs text-muted-foreground">AI optimized</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/30 text-center">
                    <p className="text-xl font-bold text-foreground">847</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 text-center">
                    <p className="text-xl font-bold text-foreground">$12.4k</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  "Your best performing subject lines mention urgency and personalization. Consider A/B testing time-sensitive offers."
                </p>
              </div>
            </div>

            {/* Total Volume */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
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
                <p className="text-5xl font-bold gradient-text">36,289</p>
                <p className="text-muted-foreground mt-2">Emails sent this month</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-foreground">12</p>
                  <p className="text-xs text-muted-foreground">Campaigns</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-foreground">98.2%</p>
                  <p className="text-xs text-muted-foreground">Delivery Rate</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-foreground">0.3%</p>
                  <p className="text-xs text-muted-foreground">Bounce Rate</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <p className="text-sm text-accent font-medium">Health Score: Excellent</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your sender reputation is in great standing
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
