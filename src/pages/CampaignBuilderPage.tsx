import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Sparkles, Clock, Users, Zap, Loader2, Check, Upload, Image, Link, FileText, Globe, Search, Tag, X, Package, MessageSquare, Mail } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  tags: string[] | null;
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

const campaignTypes = [
  { value: "marketing", label: "Marketing Campaign", description: "Standard promotional email", icon: "📧" },
  { value: "product_showcase", label: "Product Showcase", description: "Highlight a product with details & CTA", icon: "🛍️" },
  { value: "feedback_form", label: "Feedback / Review Request", description: "Ask customers for product feedback", icon: "📝" },
];

const tones = [
  { value: "professional", label: "Professional", description: "Formal and business-appropriate", icon: "📊" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational", icon: "😊" },
  { value: "urgent", label: "Urgent", description: "Time-sensitive and action-driven", icon: "⚡" },
  { value: "benefit_driven", label: "Benefit Driven", description: "Highlight value and outcomes", icon: "🎯" },
  { value: "announcement", label: "Announcement", description: "Big news and product launches", icon: "📢" },
];

const CampaignBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [draftId, setDraftId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [campaignType, setCampaignType] = useState("marketing");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const lastClickedIndex = useRef<number | null>(null);

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
        .select("id, name, email, tags")
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

  // Derive all unique tags
  const allTags = Array.from(
    new Set(customers.flatMap(c => c.tags || []))
  ).sort();

  // Filtered customers based on search + tag filters
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => c.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const selectFiltered = () => {
    const filteredIds = filteredCustomers.map(c => c.id);
    setSelectedCustomers(prev => {
      const newSet = new Set(prev);
      filteredIds.forEach(id => newSet.add(id));
      return Array.from(newSet);
    });
  };

  const deselectFiltered = () => {
    const filteredIds = new Set(filteredCustomers.map(c => c.id));
    setSelectedCustomers(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const handleCustomerClick = (customerId: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastClickedIndex.current !== null) {
      // Shift-click: select range
      const start = Math.min(lastClickedIndex.current, index);
      const end = Math.max(lastClickedIndex.current, index);
      const rangeIds = filteredCustomers.slice(start, end + 1).map(c => c.id);
      setSelectedCustomers(prev => {
        const newSet = new Set(prev);
        rangeIds.forEach(id => newSet.add(id));
        return Array.from(newSet);
      });
    } else {
      toggleCustomer(customerId);
    }
    lastClickedIndex.current = index;
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
          campaignType,
          productName: productName || undefined,
          productDescription: productDescription || undefined,
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

  const handleExtractImage = async () => {
    if (!ctaLink.trim()) {
      toast.error("Please enter a CTA link first");
      return;
    }

    setIsFetchingImage(true);

    try {
      const response = await supabase.functions.invoke("extract-image", {
        body: { url: ctaLink },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.imageUrl) {
        setImageUrl(response.data.imageUrl);
        toast.success("Product image extracted from link!");
      } else {
        toast.info("No product image found on that page. Try uploading manually.");
      }
    } catch (error: any) {
      console.error("Error extracting image:", error);
      toast.error("Could not extract image from link");
    } finally {
      setIsFetchingImage(false);
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
            tone: selectedTone as any,
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
            tone: selectedTone as any,
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
            tone: selectedTone as any,
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
            tone: selectedTone as any,
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
          tone: selectedTone as any,
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
                  {/* Search + Tag Filters */}
                  <div className="space-y-3 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Tag size={12} /> Filter by tag:
                        </span>
                        {allTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border transition-colors",
                              selectedTags.includes(tag)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                            )}
                          >
                            {tag}
                            {selectedTags.includes(tag) && <X size={10} className="inline ml-1" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selection Controls */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={toggleAllCustomers}>
                        {selectedCustomers.length === customers.length ? "Deselect All" : "Select All"}
                      </Button>
                      {(customerSearch || selectedTags.length > 0) && (
                        <>
                          <Button variant="outline" size="sm" onClick={selectFiltered} className="text-xs">
                            Select Filtered ({filteredCustomers.length})
                          </Button>
                          <Button variant="outline" size="sm" onClick={deselectFiltered} className="text-xs">
                            Deselect Filtered
                          </Button>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedCustomers.length} of {customers.length} selected
                      {(customerSearch || selectedTags.length > 0) && (
                        <span className="ml-1">· {filteredCustomers.length} shown</span>
                      )}
                    </span>
                  </div>

                  {/* Shift-click hint */}
                  <p className="text-xs text-muted-foreground mb-2">
                    💡 Hold <kbd className="px-1 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-mono">Shift</kbd> + click to select a range
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">No subscribers match your filters.</p>
                    ) : (
                      filteredCustomers.map((customer, index) => (
                        <label
                          key={customer.id}
                          onClick={(e) => { e.preventDefault(); handleCustomerClick(customer.id, index, e); }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors select-none",
                            selectedCustomers.includes(customer.id)
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-secondary/30 hover:bg-secondary/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => {}}
                            className="rounded border-border pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{customer.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                          </div>
                          {customer.tags && customer.tags.length > 0 && (
                            <div className="flex gap-1 flex-shrink-0">
                              {customer.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                  {tag}
                                </span>
                              ))}
                              {customer.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{customer.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Campaign Type & Settings */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Send size={20} className="text-primary" />
                Campaign Settings
              </h2>

              <div className="space-y-4">
                {/* Campaign Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Campaign Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {campaignTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setCampaignType(type.value);
                          // Set smart defaults based on type
                          if (type.value === "feedback_form" && !ctaText) {
                            setCtaText("Leave a Review");
                          } else if (type.value === "product_showcase" && !ctaText) {
                            setCtaText("Shop Now");
                          }
                        }}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all",
                          campaignType === type.value
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border bg-secondary/20 hover:bg-secondary/40"
                        )}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <p className="text-sm font-medium text-foreground mt-1">{type.label}</p>
                        <p className="text-[11px] text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Details (shown for product_showcase and feedback_form) */}
                {(campaignType === "product_showcase" || campaignType === "feedback_form") && (
                  <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-secondary/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Package size={14} className="text-primary" />
                      Product Details
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Product Name</label>
                        <Input
                          placeholder="e.g., Premium Headphones"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Short Description</label>
                        <Input
                          placeholder="e.g., Noise-cancelling wireless headphones"
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subject Line</label>
                  <Input
                    placeholder={
                      campaignType === "feedback_form"
                        ? "e.g., How's your experience with our product?"
                        : campaignType === "product_showcase"
                        ? "e.g., Introducing our latest product"
                        : "Enter your email subject..."
                    }
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
                <div className="space-y-4">
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

                  {ctaLink && (
                    <Button
                      variant="outline"
                      onClick={handleExtractImage}
                      disabled={isFetchingImage}
                      className="w-full gap-2"
                    >
                      {isFetchingImage ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Extracting from link...
                        </>
                      ) : (
                        <>
                          <Globe size={16} />
                          Auto-extract image from CTA link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Tone Selection */}
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Zap size={20} className="text-primary" />
                Email Tone
              </h2>

              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      <span className="flex items-center gap-2">
                        <span>{tone.icon}</span>
                        <span>{tone.label}</span>
                        <span className="text-muted-foreground text-xs">— {tone.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "500ms" }}>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{selectedCustomers.length}</p>
                <p className="text-sm text-muted-foreground">Recipients</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-accent">~68%</p>
                <p className="text-sm text-muted-foreground">Est. Open Rate</p>
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
