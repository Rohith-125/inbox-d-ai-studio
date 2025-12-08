import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title={pageName} />
        
        <main className="p-6">
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center animate-slide-up">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Construction className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {pageName} Coming Soon
            </h2>
            <p className="text-muted-foreground max-w-md">
              We're working hard to bring you this feature. Check back soon for updates!
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlaceholderPage;
