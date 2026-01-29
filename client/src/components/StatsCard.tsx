import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
  color?: "default" | "primary" | "success" | "warning" | "destructive";
}

export function StatsCard({ title, value, icon, trend, color = "default" }: StatsCardProps) {
  const colorStyles = {
    default: "bg-white border-border text-foreground",
    primary: "bg-blue-50 border-blue-100 text-blue-900",
    success: "bg-green-50 border-green-100 text-green-900",
    warning: "bg-amber-50 border-amber-100 text-amber-900",
    destructive: "bg-red-50 border-red-100 text-red-900",
  };

  const iconStyles = {
    default: "bg-gray-100 text-gray-600",
    primary: "bg-blue-100 text-blue-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-amber-100 text-amber-600",
    destructive: "bg-red-100 text-red-600",
  };

  return (
    <div className={cn(
      "p-6 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md",
      colorStyles[color]
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-70 mb-1">{title}</p>
          <h3 className="text-3xl font-display font-bold">{value}</h3>
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[color])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 text-xs font-medium opacity-80">
          {trend}
        </div>
      )}
    </div>
  );
}
