import { useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Info, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Insight {
  title: string;
  description: string;
  type: "success" | "warning" | "tip" | "info";
}

const typeConfig = {
  success: { icon: TrendingUp, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  tip: { icon: Lightbulb, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
};

const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights");

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setInsights(data.insights || []);
      setHasFetched(true);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
            <p className="text-sm text-muted-foreground">Smart analysis of your email performance</p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {hasFetched ? "Refresh" : "Generate"}
        </button>
      </div>

      {!hasFetched && !isLoading && (
        <div className="text-center py-8">
          <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Click "Generate" to get AI-powered insights about your campaigns
          </p>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Analyzing your campaign data...</p>
        </div>
      )}

      {hasFetched && !isLoading && (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-lg border ${config.bg} ${config.border}`}
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                <div>
                  <p className={`font-medium text-sm ${config.color}`}>{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
