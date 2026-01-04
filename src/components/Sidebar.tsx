import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Send, Users, Settings, BarChart3, Zap, Clock } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Send, label: "Campaigns", path: "/campaigns" },
  { icon: Clock, label: "Scheduled", path: "/scheduled" },
  { icon: Users, label: "Subscribers", path: "/subscribers" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Zap, label: "Automations", path: "/automations" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col z-50">
      <div className="p-6 border-b border-border/50">
        <Logo size="md" />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon size={20} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="glass-card p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap size={16} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Pro Plan</span>
          </div>
          <p className="text-xs text-muted-foreground">
            5,000 emails remaining this month
          </p>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-primary to-purple-500 rounded-full" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
