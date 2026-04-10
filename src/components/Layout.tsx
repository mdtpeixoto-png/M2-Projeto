import React from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Bot, 
  Database, 
  Mail, 
  Phone,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "conversations", label: "Conversas", icon: MessageSquare },
    { id: "agent", label: "Agente IA", icon: Bot },
    { id: "integrations", label: "Integrações", icon: Database },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#002e5d] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">M2</div>
            M2 IA
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                activeTab === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-300 hover:bg-blue-900/50 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900/50">
          <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-blue-900/50 gap-3">
            <LogOut className="w-5 h-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Sistema Online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
