import { useState, useEffect } from "react";
import { Mail, Send, Eye, MousePointer, Calendar, Users, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SentCampaign {
  id: string;
  name: string;
  subject: string;
  sent_at: string;
  status: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
}

const SentCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<SentCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentCampaigns();
  }, []);

  const fetchSentCampaigns = async () => {
    try {
      // Fetch sent campaigns with email stats
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id, name, subject, sent_at, status")
        .eq("status", "sent")
        .order("sent_at", { ascending: false });

      if (campaignsError) throw campaignsError;

      // Fetch stats for each campaign
      const campaignsWithStats = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: sends } = await supabase
            .from("email_sends")
            .select("id, status, opened_at, clicked_at")
            .eq("campaign_id", campaign.id);

          const totalSent = sends?.filter(s => s.status === "sent").length || 0;
          const totalOpened = sends?.filter(s => s.opened_at).length || 0;
          const totalClicked = sends?.filter(s => s.clicked_at).length || 0;

          return {
            ...campaign,
            total_sent: totalSent,
            total_opened: totalOpened,
            total_clicked: totalClicked,
          };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error("Error fetching sent campaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return "0%";
    return `${Math.round((opened / sent) * 100)}%`;
  };

  const getClickRate = (clicked: number, sent: number) => {
    if (sent === 0) return "0%";
    return `${Math.round((clicked / sent) * 100)}%`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title="Sent Campaigns" subtitle="View your email campaign history and performance" />
        
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No sent campaigns yet</h3>
                <p className="text-muted-foreground">
                  Once you launch a campaign, it will appear here with performance metrics.
                </p>
              </div>
            ) : (
              <div className="glass-card p-6 animate-slide-up">
                <div className="flex items-center gap-2 mb-6">
                  <Send className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Campaign History</h2>
                  <Badge variant="secondary" className="ml-2">
                    {campaigns.length} campaigns
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Sent At
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          Recipients
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          Opens
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <MousePointer size={14} />
                          Clicks
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {campaign.subject}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(campaign.sent_at)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{campaign.total_sent}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary">{campaign.total_opened}</span>
                            <span className="text-xs text-muted-foreground">
                              ({getOpenRate(campaign.total_opened, campaign.total_sent)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-accent">{campaign.total_clicked}</span>
                            <span className="text-xs text-muted-foreground">
                              ({getClickRate(campaign.total_clicked, campaign.total_sent)})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                            Sent
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SentCampaignsPage;
