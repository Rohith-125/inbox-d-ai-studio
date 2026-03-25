import { useState, useEffect, useRef } from "react";
import { Sparkles, Users, Loader2, Check, Search, Tag, X, Send, Eye, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  name: string;
  email: string;
  tags: string[] | null;
  cart_status: string | null;
  last_purchase_date: string | null;
  total_purchases: number | null;
  engagement_level: string | null;
}

interface PersonalizedEmail {
  subscriberId: string;
  subject: string;
  body: string;
}

const tones = [
  { value: "professional", label: "Professional", icon: "📊" },
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "urgent", label: "Urgent", icon: "⚡" },
  { value: "benefit_driven", label: "Benefit Driven", icon: "🎯" },
  { value: "announcement", label: "Announcement", icon: "📢" },
];

const PersonalizationPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState("professional");
  const [productContext, setProductContext] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [personalizedEmails, setPersonalizedEmails] = useState<PersonalizedEmail[]>([]);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const lastClickedIndex = useRef<number | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile?.username) setSenderName(profile.username);
    }
  };

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, email, tags, cart_status, last_purchase_date, total_purchases, engagement_level")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setCustomers(data as Customer[]);
    setIsLoadingCustomers(false);
  };

  const allTags = Array.from(new Set(customers.flatMap((c) => c.tags || [])));

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 || selectedTags.some((t) => c.tags?.includes(t));
    return matchesSearch && matchesTags;
  });

  const handleCustomerToggle = (id: string, index: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedIndex.current !== null) {
      const start = Math.min(lastClickedIndex.current, index);
      const end = Math.max(lastClickedIndex.current, index);
      const rangeIds = filteredCustomers.slice(start, end + 1).map((c) => c.id);
      setSelectedCustomers((prev) => Array.from(new Set([...prev, ...rangeIds])));
    } else {
      setSelectedCustomers((prev) =>
        prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
      );
    }
    lastClickedIndex.current = index;
  };

  const handleSelectAll = () => {
    const filteredIds = filteredCustomers.map((c) => c.id);
    const allSelected = filteredIds.every((id) => selectedCustomers.includes(id));
    if (allSelected) {
      setSelectedCustomers((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedCustomers((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleGenerate = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Select at least one subscriber");
      return;
    }

    setIsGenerating(true);
    setPersonalizedEmails([]);

    try {
      const selectedSubs = customers.filter((c) => selectedCustomers.includes(c.id));
      const { data, error } = await supabase.functions.invoke("generate-personalized-email", {
        body: {
          subscribers: selectedSubs.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            cart_status: s.cart_status,
            last_purchase_date: s.last_purchase_date,
            total_purchases: s.total_purchases,
            engagement_level: s.engagement_level,
            tags: s.tags,
          })),
          tone: selectedTone,
          senderName,
          productContext: productContext || undefined,
        },
      });

      if (error) throw error;
      if (data?.results) {
        setPersonalizedEmails(data.results);
        toast.success(`Generated ${data.results.length} personalized emails!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate personalized emails");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendAll = async () => {
    if (personalizedEmails.length === 0) return;
    if (!fromEmail) {
      toast.error("Please enter a From Email address");
      return;
    }

    setIsSending(true);
    let sent = 0;
    let failed = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const pe of personalizedEmails) {
        const customer = customers.find((c) => c.id === pe.subscriberId);
        if (!customer) continue;

        // Create campaign for this personalized email
        const { data: campaign, error: campError } = await supabase
          .from("campaigns")
          .insert({
            user_id: user.id,
            name: `Personalized: ${pe.subject}`,
            subject: pe.subject,
            body: pe.body,
            status: "sending" as any,
            tone: selectedTone as any,
          })
          .select()
          .single();

        if (campError || !campaign) {
          failed++;
          continue;
        }

        const { data: sendResult, error: sendError } = await supabase.functions.invoke(
          "send-campaign-emails",
          {
            body: {
              campaignId: campaign.id,
              subject: pe.subject,
              body: pe.body,
              customerIds: [pe.subscriberId],
              fromEmail,
              fromName: senderName || "Inbox'd",
            },
          }
        );

        if (sendError) {
          failed++;
        } else {
          sent += sendResult?.sent || 0;
          failed += sendResult?.failed || 0;
        }
      }

      if (sent > 0) toast.success(`Sent ${sent} personalized emails!`);
      if (failed > 0) toast.error(`${failed} emails failed to send`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (customer: Customer) => {
    const badges = [];
    if (customer.cart_status && customer.cart_status !== "empty") {
      badges.push(
        <Badge
          key="cart"
          variant={customer.cart_status === "abandoned" ? "destructive" : "default"}
          className="text-[10px] px-1.5 py-0"
        >
          Cart: {customer.cart_status}
        </Badge>
      );
    }
    if (customer.engagement_level) {
      const colors: Record<string, string> = {
        new: "bg-blue-500/20 text-blue-400",
        active: "bg-emerald-500/20 text-emerald-400",
        inactive: "bg-orange-500/20 text-orange-400",
        vip: "bg-purple-500/20 text-purple-400",
      };
      badges.push(
        <span key="eng" className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", colors[customer.engagement_level] || "")}>
          {customer.engagement_level.toUpperCase()}
        </span>
      );
    }
    return badges;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Personalization</h1>
                <p className="text-sm text-muted-foreground">Generate unique emails based on subscriber behavior</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Subscriber Selection */}
              <div className="space-y-4">
                <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users size={18} /> Select Subscribers
                  </h2>

                  {/* Search & Tags */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        placeholder="Search subscribers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-9 bg-secondary/50 border-border/50"
                      />
                    </div>

                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() =>
                              setSelectedTags((prev) =>
                                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                              )
                            }
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
                              selectedTags.includes(tag)
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                            )}
                          >
                            <Tag size={10} />
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Select All */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedCustomers.length} of {customers.length} selected
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-xs">
                      {filteredCustomers.every((c) => selectedCustomers.includes(c.id))
                        ? "Deselect Filtered"
                        : "Select Filtered"}
                    </Button>
                  </div>

                  {/* Customer List */}
                  <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1">
                    {isLoadingCustomers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-8">No subscribers found</p>
                    ) : (
                      filteredCustomers.map((customer, index) => (
                        <button
                          key={customer.id}
                          onClick={(e) => handleCustomerToggle(customer.id, index, e.shiftKey)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                            selectedCustomers.includes(customer.id)
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                              selectedCustomers.includes(customer.id)
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {selectedCustomers.includes(customer.id) && <Check size={12} className="text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{customer.name}</p>
                              {getStatusBadge(customer)}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Settings & Results */}
              <div className="space-y-4">
                {/* Settings */}
                <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Settings</h2>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Tone</label>
                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger className="bg-secondary/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tones.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.icon} {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">From Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="hello@mail.inboxd.xyz"
                          value={fromEmail}
                          onChange={(e) => setFromEmail(e.target.value)}
                          className="pl-9 bg-secondary/50 border-border/50"
                          type="email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Product/Brand Context (optional)</label>
                      <Input
                        placeholder="e.g. We sell premium headphones..."
                        value={productContext}
                        onChange={(e) => setProductContext(e.target.value)}
                        className="bg-secondary/50 border-border/50"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedCustomers.length === 0}
                    className="w-full bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Analyzing & Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2" size={16} />
                        Generate Personalized Emails ({selectedCustomers.length})
                      </>
                    )}
                  </Button>
                </div>

                {/* Generated Emails Preview */}
                {personalizedEmails.length > 0 && (
                  <div className="bg-card/50 border border-border/50 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Eye size={18} /> Preview ({personalizedEmails.length} emails)
                      </h2>
                      <Button
                        onClick={handleSendAll}
                        disabled={isSending || !fromEmail}
                        size="sm"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        {isSending ? (
                          <><Loader2 className="animate-spin mr-2" size={14} /> Sending...</>
                        ) : (
                          <><Send className="mr-2" size={14} /> Send All</>
                        )}
                      </Button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                      {personalizedEmails.map((pe) => {
                        const customer = customers.find((c) => c.id === pe.subscriberId);
                        const isExpanded = expandedEmail === pe.subscriberId;
                        return (
                          <div
                            key={pe.subscriberId}
                            className="border border-border/50 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedEmail(isExpanded ? null : pe.subscriberId)}
                              className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {customer?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Subject: {pe.subject}
                                </p>
                              </div>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3 border-t border-border/30">
                                <p className="text-xs text-muted-foreground mt-2 mb-1">To: {customer?.email}</p>
                                <p className="text-xs font-medium text-primary mb-2">Subject: {pe.subject}</p>
                                <div className="bg-secondary/30 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">
                                  {pe.body}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PersonalizationPage;
