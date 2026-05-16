import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import AppSidebar from "@/components/layout/AppSidebar";

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-[#FBF7EE] text-foreground">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => navigate("/chat")}
        currentMode="megsy-pr"
      />

      <header className="px-5 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-full grid place-items-center border border-foreground/10 bg-background/40"
          aria-label="Menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        <h1 className="text-xl font-bold">Community</h1>
      </header>

      <div className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Templates coming soon</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Browse community templates and remix them as your starting point.
        </p>
        <button
          onClick={() => navigate("/build")}
          className="px-6 py-3 rounded-full bg-foreground text-background font-semibold text-sm"
        >
          Start a new project
        </button>
      </div>
    </div>
  );
}
