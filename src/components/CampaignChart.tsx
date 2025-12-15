import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ChartData {
  month: string;
  opens: number;
  clicks: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-4 border border-border/50">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CampaignChart = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      // Fetch email events with their associated email sends
      const { data: emailEvents } = await supabase
        .from("email_events")
        .select(`
          id,
          event_type,
          created_at
        `);

      // Group events by month
      const monthlyData: Record<string, { opens: number; clicks: number }> = {};

      // Initialize last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        months.push(monthKey);
        monthlyData[monthKey] = { opens: 0, clicks: 0 };
      }

      // Count events per month
      emailEvents?.forEach((event) => {
        const eventDate = new Date(event.created_at);
        const monthKey = eventDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (monthlyData[monthKey]) {
          if (event.event_type === 'open') {
            monthlyData[monthKey].opens++;
          } else if (event.event_type === 'click') {
            monthlyData[monthKey].clicks++;
          }
        }
      });

      // Convert to chart data format
      const chartData = months.map((month) => ({
        month,
        opens: monthlyData[month].opens,
        clicks: monthlyData[month].clicks,
      }));

      setData(chartData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = data.some(d => d.opens > 0 || d.clicks > 0);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Campaign Performance</h3>
        <p className="text-sm text-muted-foreground">Opens and clicks over the last 6 months</p>
      </div>
      <div className="h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-lg font-medium">No campaign data yet</p>
            <p className="text-sm">Launch your first campaign to see performance metrics here</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(215 20% 65%)" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(215 20% 65%)" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="opens"
                name="Total Opens"
                stroke="hsl(239 84% 67%)"
                strokeWidth={3}
                dot={{ fill: "hsl(239 84% 67%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                name="Total Clicks"
                stroke="hsl(160 84% 39%)"
                strokeWidth={3}
                dot={{ fill: "hsl(160 84% 39%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default CampaignChart;