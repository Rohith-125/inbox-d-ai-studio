import { useState } from "react";
import { Send, Sparkles, Clock, Users, Zap, ChevronDown, Loader2, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const audiences = [
  { value: "all", label: "All Clients", count: "12,458" },
  { value: "high-value", label: "High Value Customers", count: "2,341" },
  { value: "recent", label: "Recent Signups (30 days)", count: "847" },
  { value: "inactive", label: "Inactive Users", count: "3,129" },
  { value: "engaged", label: "Highly Engaged", count: "5,672" },
];

const tones = [
  { value: "professional", label: "Professional", description: "Formal and business-appropriate", icon: "📊" },
  { value: "friendly", label: "Friendly", description: "Warm and conversational", icon: "😊" },
  { value: "urgent", label: "Urgent", description: "Time-sensitive and action-driven", icon: "⚡" },
  { value: "casual", label: "Casual", description: "Relaxed and approachable", icon: "👋" },
];

const CampaignBuilderPage = () => {
  const [subject, setSubject] = useState("🚀 Exclusive: Your Early Access to Our New Features!");
  const [emailBody, setEmailBody] = useState(`Dear Valued Customer,

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
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);

  const handleGenerateAI = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject line first");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const toneMessages = {
      professional: `Dear Valued Customer,

We are pleased to introduce our latest offering that we believe will significantly enhance your experience with our services.

Based on your previous interactions with us, we've identified several key features that align perfectly with your business objectives:

• Advanced automation capabilities
• Real-time analytics dashboard  
• Seamless integration options

We would be delighted to schedule a personalized demonstration at your earliest convenience.

Best regards,
The Inbox'd Team`,
      friendly: `Hey there! 👋

Hope you're having an amazing day! We've been working on something really exciting that we couldn't wait to share with you.

You know how [problem they face]? Well, we've got some pretty awesome news...

Here's what's new:
✨ Feature one that you'll love
🚀 Something that'll save you tons of time
💡 A smart way to do things better

Can't wait for you to try it out! Hit reply if you have any questions – we're always here to chat.

Cheers,
Your friends at Inbox'd`,
      urgent: `⚠️ ACTION REQUIRED - Limited Time Offer

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
      casual: `Hey! 

Quick note – we just dropped something cool and thought you'd want to know about it.

No pressure or anything, but we think you might dig this:

- Thing one (pretty neat)
- Thing two (honestly my favorite)
- Thing three (game changer)

Anyway, check it out when you get a chance. Or don't – no worries either way! 

Later,
The Inbox'd crew`,
    };

    setEmailBody(toneMessages[selectedTone as keyof typeof toneMessages]);
    setIsGenerating(false);
    toast.success("Email content generated with AI!");
  };

  const handleLaunchCampaign = () => {
    if (!subject.trim() || !emailBody.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const audience = audiences.find(a => a.value === selectedAudience);
    toast.success(`Campaign launched to ${audience?.count || "0"} recipients!`);
  };

  const currentAudience = audiences.find(a => a.value === selectedAudience);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title="Campaign Builder" subtitle="Create and launch your next email campaign" />
        
        <main className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Campaign Settings */}
            <div className="glass-card p-6 animate-slide-up">
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Campaign Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Audience Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Target Audience</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-input/50 text-foreground text-left transition-all duration-200 hover:border-primary/50"
                    >
                      <div>
                        <span>{currentAudience?.label}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({currentAudience?.count} contacts)
                        </span>
                      </div>
                      <ChevronDown 
                        size={18} 
                        className={cn(
                          "text-muted-foreground transition-transform duration-200",
                          isAudienceOpen && "rotate-180"
                        )} 
                      />
                    </button>

                    {isAudienceOpen && (
                      <div className="absolute z-10 w-full mt-2 py-2 rounded-lg border border-border bg-card shadow-lg">
                        {audiences.map((audience) => (
                          <button
                            key={audience.value}
                            onClick={() => {
                              setSelectedAudience(audience.value);
                              setIsAudienceOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                              selectedAudience === audience.value
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-secondary/50"
                            )}
                          >
                            <span>{audience.label}</span>
                            <span className="text-sm text-muted-foreground">{audience.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject Line */}
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
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <Zap size={20} className="text-primary" />
                Email Tone
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
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
                AI will generate content matching your selected tone: <span className="text-primary font-medium">{tones.find(t => t.value === selectedTone)?.label}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="gap-2">
                  <Clock size={16} />
                  Schedule for Later
                </Button>
                <Button variant="glass">
                  Save as Draft
                </Button>
              </div>

              <Button
                variant="accent"
                size="lg"
                onClick={handleLaunchCampaign}
                className="gap-2"
              >
                <Send size={18} />
                Launch Campaign Now
              </Button>
            </div>

            {/* Preview Stats */}
            <div className="grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{currentAudience?.count}</p>
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
