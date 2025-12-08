import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "Jan", opens: 4200, clicks: 2400 },
  { month: "Feb", opens: 5100, clicks: 2800 },
  { month: "Mar", opens: 4800, clicks: 3200 },
  { month: "Apr", opens: 6200, clicks: 3800 },
  { month: "May", opens: 7100, clicks: 4200 },
  { month: "Jun", opens: 8400, clicks: 5100 },
];

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
  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Campaign Performance</h3>
        <p className="text-sm text-muted-foreground">Opens and clicks over the last 6 months</p>
      </div>
      <div className="h-[300px]">
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
      </div>
    </div>
  );
};

export default CampaignChart;
