import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Clock, Users, Zap, Loader2, Check, Upload, Image, Link, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface DraftData {
  id: string;
  subject: string;
  body: string;
  tone: string;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
  scheduled_at: string | null;
}

const tones = [
  { value: "professional", label: "Professional", description: "Formal and business-appropriate", icon: "📊" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational", icon: "😊" },
  { value: "urgent", label: "Urgent", description: "Time-sensitive and action-driven", icon: "⚡" },
];

const CampaignBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [draftId, setDraftId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    fetchCustomers();
    fetchUserProfile();
    
    // Load draft if passed from DraftsPage
    const draft = location.state?.draft as DraftData | undefined;
    if (draft) {
      setDraftId(draft.id);
      setSubject(draft.subject);
      setEmailBody(draft.body);
      setSelectedTone(draft.tone);
      setCtaText(draft.cta_text || "");
      setCtaLink(draft.cta_link || "");
      setImageUrl(draft.image_url || "");
      if (draft.scheduled_at) {
        const date = new Date(draft.scheduled_at);
        setScheduleDate(date.toISOString().split("T")[0]);
        setScheduleTime(date.toTimeString().slice(0, 5));
      }
    }
  }, [location.state]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.username) {
        setSenderName(data.username);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      setSelectedCustomers((data || []).map(c => c.id));
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("campaign-images")
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line first");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke("generate-email", {
        body: {
          subject,
          tone: selectedTone,
          ctaText: ctaText || undefined,
          ctaLink: ctaLink || undefined,
          imageDescription: imageUrl ? "A promotional image/product banner is included" : undefined,
          senderName: senderName || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.content) {
        setEmailBody(response.data.content);
        toast.success("Email content generated with AI!");
      } else {
        throw new Error("No content generated");
      }
    } catch (error: any) {
      console.error("Error generating email:", error);
      toast.error(error.message || "Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from("campaigns")
          .update({
            name: subject.substring(0, 50),
            subject,
            body: emailBody || "",
            tone: selectedTone as "professional" | "friendly" | "urgent",
            cta_text: ctaText || null,
            cta_link: ctaLink || null,
            image_url: imageUrl || null,
          })
          .eq("id", draftId);

        if (error) throw error;
        toast.success("Draft updated successfully");
      } else {
        // Create new draft
        const { error } = await supabase
          .from("campaigns")
          .insert({
            name: subject.substring(0, 50),
            subject,
            body: emailBody || "",
            tone: selectedTone as "professional" | "friendly" | "urgent",
            status: "draft",
            user_id: user.id,
            cta_text: ctaText || null,
            cta_link: ctaLink || null,
            image_url: imageUrl || null,
          });

        if (error) throw error;
        toast.success("Draft saved successfully");
      }
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleCampaign = async () => {
    if (!subject.trim() || !emailBody.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast.error("Please select date and time");
      return;
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    setIsScheduling(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (draftId) {
        // Update existing campaign
        const { error } = await supabase
          .from("campaigns")
          .update({
            name: subject.substring(0, 50),
            subject,
            body: emailBody,
            tone: selectedTone as "professional" | "friendly" | "urgent",
            status: "scheduled",
            scheduled_at: scheduledAt.toISOString(),
            cta_text: ctaText || null,
            cta_link: ctaLink || null,
            image_url: imageUrl || null,
          })
          .eq("id", draftId);

        if (error) throw error;
      } else {
        // Create new scheduled campaign
        const { error } = await supabase
          .from("campaigns")
          .insert({
            name: subject.substring(0, 50),
            subject,
            body: emailBody,
            tone: selectedTone as "professional" | "friendly" | "urgent",
            status: "scheduled",
            user_id: user.id,
            scheduled_at: scheduledAt.toISOString(),
            cta_text: ctaText || null,
            cta_link: ctaLink || null,
            image_url: imageUrl || null,
          });

        if (error) throw error;
      }

      toast.success(`Campaign scheduled for ${scheduledAt.toLocaleString()}`);
      setShowScheduleDialog(false);
      navigate("/scheduled");
    } catch (error: any) {
      console.error("Error scheduling campaign:", error);
      toast.error(error.message || "Failed to schedule campaign");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!subject.trim() || !emailBody.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    setIsLaunching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          name: subject.substring(0, 50),
          subject,
          body: emailBody,
          tone: selectedTone as "professional" | "friendly" | "urgent",
          status: "sending",
          user_id: user.id,
          cta_text: ctaText || null,
          cta_link: ctaLink || null,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const response = await supabase.functions.invoke("send-campaign-emails", {
        body: {
          campaignId: campaign.id,
          subject,
          body: emailBody,
          customerIds: selectedCustomers,
          fromName: senderName || undefined,
          ctaText: ctaText || undefined,
          ctaLink: ctaLink || undefined,
          imageUrl: imageUrl || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast.success(`Campaign launched! ${result.sent} emails sent, ${result.failed} failed.`);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error launching campaign:", error);
      toast.error(error.message || "Failed to launch campaign");
    } finally {
      setIsLaunching(false);
    }
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-4 pt-16">
        <Header title="Campaign Builder" subtitle="Create and launch your next email campaign" />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Customer Selection */}
            <div className="glass-card p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Select Recipients
                </h2>
                {customers.length === 0 && !isLoadingCustomers && (
                  <Button variant="outline" onClick={() => navigate("/subscribers")} className="gap-2">
                    <Upload size={16} />
                    Import Customers
                  </Button>
                )}
              </div>

              {isLoadingCustomers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No customers yet. Import your customer list first.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" onClick={toggleAllCustomers}>
                      {selectedCustomers.length === customers.length ? "Deselect All" : "Select All"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedCustomers.length} of {customers.length} selected
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {customers.map((customer) => (
                      <label
                        key={customer.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          selectedCustomers.includes(customer.id)
                            ? "bg-primary/10 border border-primary/30"
                            : "bg-secondary/30 hover:bg-secondary/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomer(customer.id)}
                          className="rounded border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{customer.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Campaign Settings */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Send size={20} className="text-primary" />
                Campaign Settings
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subject Line</label>
                  <Input
                    placeholder="Enter your email subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileText size={14} />
                      CTA Button Text
                    </label>
                    <Input
                      placeholder="e.g., Shop Now, Get Started"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Link size={14} />
                      CTA Link URL
                    </label>
                    <Input
                      placeholder="https://your-shop.com/product"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Image size={20} className="text-primary" />
                Add Image / Product Banner
              </h2>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {imageUrl ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={imageUrl} alt="Campaign" className="w-full max-h-64 object-contain bg-secondary/20" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      Change Image
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setImageUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isUploading && "pointer-events-none opacity-50"
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Uploading..." : "Click to upload an image or product banner"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>

            {/* Tone Selection */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Zap size={20} className="text-primary" />
                Email Tone
              </h2>

              <div className="grid grid-cols-3 gap-3">
                {tones.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSelectedTone(tone.value)}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-200 text-left",
                      selectedTone === tone.value
                        ? "border-primary bg-primary/10 shadow-lg glow-primary"
                        : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                    )}
                  >
                    <div className="text-2xl mb-2">{tone.icon}</div>
                    <p className="font-medium text-foreground">{tone.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tone.description}</p>
                    {selectedTone === tone.value && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <Check size={12} />
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Body Editor */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Send size={20} className="text-primary" />
                  Email Content
                </h2>

                <Button
                  variant="gradient"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>

              <textarea
                placeholder="Write your email content here, or use AI to generate it based on your subject line, CTA, and selected tone..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-lg border border-border bg-input/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              />

              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Sparkles size={12} className="text-primary" />
                AI will use subject, CTA, tone, and image context. Use {"{{name}}"} to personalize.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between glass-card p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowScheduleDialog(true)}
                >
                  <Clock size={16} />
                  Schedule for Later
                </Button>
                <Button 
                  variant="glass" 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    draftId ? "Update Draft" : "Save as Draft"
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/drafts")}
                  className="gap-2"
                >
                  <FileText size={16} />
                  View Drafts
                </Button>
              </div>

              <Button
                variant="accent"
                size="lg"
                onClick={handleLaunchCampaign}
                disabled={isLaunching || selectedCustomers.length === 0}
                className="gap-2"
              >
                {isLaunching ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Launch Campaign Now
                  </>
                )}
              </Button>
            </div>

            {/* Preview Stats */}
            <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "500ms" }}>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{selectedCustomers.length}</p>
                <p className="text-sm text-muted-foreground">Recipients</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-accent">~68%</p>
                <p className="text-sm text-muted-foreground">Est. Open Rate</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">~$2.4k</p>
                <p className="text-sm text-muted-foreground">Est. Revenue</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when you want this campaign to be sent.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date</label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-background text-foreground border-border [color-scheme:dark] dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Time</label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-background text-foreground border-border [color-scheme:dark] dark:[color-scheme:dark]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleScheduleCampaign}
              disabled={isScheduling || !scheduleDate || !scheduleTime}
              className="gap-2"
            >
              {isScheduling ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock size={16} />
                  Schedule Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignBuilderPage;
