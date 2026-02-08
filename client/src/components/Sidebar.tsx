import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Settings, Upload, LogOut, Activity, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: settings } = useSettings();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Send, label: "Quick Send", href: "/quick-send" },
    { icon: Users, label: "Contacts", href: "/contacts" },
    { icon: Upload, label: "Import", href: "/upload" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col shadow-xl fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-2xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
          AutoMailer
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className={cn("w-4 h-4", settings?.isActive ? "text-green-500 animate-pulse" : "text-red-400")} />
          <span>Engine: <span className={cn("font-medium", settings?.isActive ? "text-green-600" : "text-red-500")}>
            {settings?.isActive ? "Running" : "Stopped"}
          </span></span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
            isActive(item.href) 
              ? "bg-primary/10 text-primary font-medium" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt={user.firstName || 'User'} 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
