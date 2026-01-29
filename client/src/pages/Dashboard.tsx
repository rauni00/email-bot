import { useContactStats } from "@/hooks/use-contacts";
import { useSettings, useToggleEngine } from "@/hooks/use-settings";
import { StatsCard } from "@/components/StatsCard";
import { 
  Users, Send, AlertTriangle, Clock, 
  Play, Pause, Upload, FileText
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useContactStats();
  const { data: settings } = useSettings();
  const { mutate: toggleEngine, isPending: isToggling } = useToggleEngine();

  const chartData = stats ? [
    { name: 'Pending', value: stats.pending, color: '#fbbf24' },
    { name: 'Sent', value: stats.sent, color: '#22c55e' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
    { name: 'Skipped', value: stats.skipped, color: '#94a3b8' },
  ] : [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const engineActive = settings?.isActive ?? false;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your email automation campaigns.</p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/upload" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            Import Contacts
          </Link>
          
          <button
            onClick={() => toggleEngine(!engineActive)}
            disabled={isToggling}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all
              ${engineActive 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25' 
                : 'bg-green-500 hover:bg-green-600 shadow-green-500/25'
              }
            `}
          >
            {isToggling ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : engineActive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {engineActive ? 'Stop Engine' : 'Start Engine'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatsCard 
            title="Total Contacts" 
            value={stats?.total || 0} 
            icon={<Users className="w-6 h-6" />}
            color="primary"
          />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatsCard 
            title="Pending" 
            value={stats?.pending || 0} 
            icon={<Clock className="w-6 h-6" />}
            color="warning"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatsCard 
            title="Sent Successfully" 
            value={stats?.sent || 0} 
            icon={<Send className="w-6 h-6" />}
            color="success"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <StatsCard 
            title="Failed" 
            value={stats?.failed || 0} 
            icon={<AlertTriangle className="w-6 h-6" />}
            color="destructive"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Delivery Analytics</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Quick Setup</h3>
          <div className="space-y-4">
            <Link href="/settings">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Configure Templates</h4>
                  <p className="text-xs text-muted-foreground">Set up your email subject & body</p>
                </div>
              </div>
            </Link>

            <Link href="/settings">
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Timing Settings</h4>
                  <p className="text-xs text-muted-foreground">Adjust delays between emails</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
