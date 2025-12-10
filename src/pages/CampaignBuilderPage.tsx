import { useState, useEffect } from "react";
import { Send, Sparkles, Clock, Users, Zap, ChevronDown, Loader2, Check, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  name: string;
  email: string;
}

const tones = [
  { value: "professional", label: "Professional", description: "Formal and business-appropriate", icon: "📊" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational", icon: "😊" },
  { value: "urgent", label: "Urgent", description: "Time-sensitive and action-driven", icon: "⚡" },
];

const CampaignBuilderPage = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("🚀 Exclusive: Your Early Access to Our New Features!");
  const [emailBody, setEmailBody] = useState(`Dear {{name}},

We're thrilled to share some exciting news with you! As one of our most valued members, you're getting exclusive early access to our latest platform updates.

Here's what's new:

✨ Smart Analytics Dashboard - Real-time insights at your fingertips
🚀 AI-Powered Recommendations - Personalized suggestions to boost your results  
📊 Advanced Reporting - Export detailed reports in multiple formats
🔒 Enhanced Security - Two-factor authentication now available

As a thank you for your loyalty, we're offering you 30% off your next month when you try these new features before anyone else.

Ready to explore? Click the button below to get started:

[Get Early Access Now]

If you have any questions, our support team is here to help 24/7.

Best regards,
The Inbox'd Team

P.S. This exclusive offer expires in 7 days - don't miss out!`);
  const [selectedTone, setSelectedTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
      // Select all customers by default
      setSelectedCustomers((data || []).map(c => c.id));
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line first");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const toneMessages: Record<string, string> = {
      professional: `Dear {{name}},

We are pleased to introduce our latest offering that we believe will significantly enhance your experience with our services.

Based on your previous interactions with us, we've identified several key features that align perfectly with your business objectives:

• Advanced automation capabilities
• Real-time analytics dashboard  
• Seamless integration options

We would be delighted to schedule a personalized demonstration at your earliest convenience.

Best regards,
The Inbox'd Team`,
      friendly: `Hey {{name}}! 👋

Hope you're having an amazing day! We've been working on something really exciting that we couldn't wait to share with you.

Here's what's new:
✨ Feature one that you'll love
🚀 Something that'll save you tons of time
💡 A smart way to do things better

Can't wait for you to try it out! Hit reply if you have any questions – we're always here to chat.

Cheers,
Your friends at Inbox'd`,
      urgent: `⚠️ ACTION REQUIRED - Limited Time Offer

Dear {{name}},

This opportunity expires in 48 hours.

We're offering our most exclusive deal of the year, and you're one of the select few invited to participate.

🔥 ACT NOW:
→ 50% off for the first 100 responders
→ Exclusive bonus content included
→ Priority access to new features

Don't miss out – this offer will NOT be extended.

Click below to claim your spot NOW →

Time is running out,
The Inbox'd Team`,
    };

    setEmailBody(toneMessages[selectedTone] || toneMessages.professional);
    setIsGenerating(false);
    toast.success("Email content generated with AI!");
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

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          name: subject.substring(0, 50),
          subject,
          body: emailBody,
          tone: selectedTone as "professional" | "friendly" | "urgent",
          status: "sending",
          user_id: user.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Get auth session for edge function
      const { data: { session } } = await supabase.auth.getSession();

      // Call edge function to send emails
      const response = await supabase.functions.invoke("send-campaign-emails", {
        body: {
          campaignId: campaign.id,
          subject,
          body: emailBody,
          customerIds: selectedCustomers,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast.success(`Campaign launched! ${result.sent} emails sent, ${result.failed} failed.`);
      
      // Navigate to dashboard to see results
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
      <div className="ml-64">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllCustomers}
                    >
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
              </div>
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
                placeholder="Write your email content here, or use AI to generate it based on your subject line and selected tone..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-lg border border-border bg-input/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              />

              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Sparkles size={12} className="text-primary" />
                Use {"{{name}}"} to personalize with customer's name
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between glass-card p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="gap-2" disabled>
                  <Clock size={16} />
                  Schedule for Later
                </Button>
                <Button variant="glass" disabled>
                  Save as Draft
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
    </div>
  );
};

export default CampaignBuilderPage;
