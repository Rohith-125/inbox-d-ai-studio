import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, Edit, Trash2, Loader2, Send } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

interface ScheduledCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  tone: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
}

const ScheduledPage = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledCampaigns();
  }, []);

  const fetchScheduledCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching scheduled campaigns:", error);
      toast.error("Failed to load scheduled campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success("Scheduled campaign deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (campaign: ScheduledCampaign) => {
    navigate("/campaigns", { state: { draft: campaign } });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-4 pt-16">
        <Header title="Scheduled Campaigns" subtitle="View and manage your scheduled email campaigns" />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="glass-card p-12 text-center animate-slide-up">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No scheduled campaigns</h3>
                <p className="text-muted-foreground mb-6">
                  Schedule a campaign from the Campaign Builder to see it here.
                </p>
                <Button variant="gradient" onClick={() => navigate("/campaigns")} className="gap-2">
                  <Send size={16} />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="glass-card p-6 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {campaign.subject}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                            Scheduled
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {campaign.body || "No content yet..."}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {campaign.scheduled_at && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Calendar size={12} />
                              Sends: {formatDate(campaign.scheduled_at)}
                            </span>
                          )}
                          <span className="capitalize">Tone: {campaign.tone}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                          className="gap-2"
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel scheduled campaign?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{campaign.subject}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(campaign.id)}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={deletingId === campaign.id}
                              >
                                {deletingId === campaign.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ScheduledPage;
