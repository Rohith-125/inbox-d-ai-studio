import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, Edit, Trash2, Loader2, Send } from "lucide-react";
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

interface Draft {
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

const DraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .in("status", ["draft", "scheduled"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      toast.error("Failed to load drafts");
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

      setDrafts(drafts.filter(d => d.id !== id));
      toast.success("Draft deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (draft: Draft) => {
    // Navigate to campaign builder with draft data
    navigate("/campaigns", { state: { draft } });
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
      <div className="ml-64">
        <Header title="Drafts & Scheduled" subtitle="Manage your saved and scheduled campaigns" />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : drafts.length === 0 ? (
              <div className="glass-card p-12 text-center animate-slide-up">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No drafts yet</h3>
                <p className="text-muted-foreground mb-6">
                  Your saved drafts and scheduled campaigns will appear here.
                </p>
                <Button variant="gradient" onClick={() => navigate("/campaigns")} className="gap-2">
                  <Send size={16} />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="glass-card p-6 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {draft.subject}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            draft.status === "scheduled" 
                              ? "bg-primary/20 text-primary" 
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {draft.status === "scheduled" ? "Scheduled" : "Draft"}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {draft.body || "No content yet..."}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Created: {formatDate(draft.created_at)}
                          </span>
                          {draft.scheduled_at && (
                            <span className="flex items-center gap-1 text-primary">
                              <Calendar size={12} />
                              Scheduled: {formatDate(draft.scheduled_at)}
                            </span>
                          )}
                          <span className="capitalize">Tone: {draft.tone}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(draft)}
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
                              <AlertDialogTitle>Delete draft?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{draft.subject}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(draft.id)}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={deletingId === draft.id}
                              >
                                {deletingId === draft.id ? "Deleting..." : "Delete"}
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

export default DraftsPage;
