"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowUpRight, Ban, Users, DollarSign, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";

interface DashboardKPIs {
  critical_incidents: number;
  broken_journeys: number;
  revenue_impact: number;
  cx_health_score: number;
  customers_at_risk: number;
  active_alerts: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/dashboard/kpis");
        setKpis(response.data);
      } catch (error) {
        console.error("Error fetching KPIs:", error);
      }
    };
    fetchKPIs();
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-muted-foreground mt-1">Cross-channel customer journey performance overview.</p>
          </div>
          <div className="text-sm px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Streaming Active
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <KpiCard
            title="Critical Incidents"
            value={kpis?.critical_incidents ?? "—"}
            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            trend="+2 from yesterday"
            trendUp={true}
          />
          <KpiCard
            title="Broken Journeys"
            value={kpis?.broken_journeys ?? "—"}
            icon={<Ban className="h-5 w-5 text-orange-500" />}
            trend="-14% vs last week"
            trendUp={false}
          />
          <KpiCard
            title="Revenue Impact"
            value={`$${kpis?.revenue_impact?.toLocaleString() ?? "—"}`}
            icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
            trend="+$12k at risk"
            trendUp={true}
          />
          <KpiCard
            title="CX Health Score"
            value={kpis?.cx_health_score ?? "—"}
            icon={<Activity className="h-5 w-5 text-blue-500" />}
            trend="Needs Improvement"
            trendUp={false}
          />
          <KpiCard
            title="Customers at Risk"
            value={kpis?.customers_at_risk ?? "—"}
            icon={<Users className="h-5 w-5 text-purple-500" />}
            trend="Top 1% VIPs affected"
            trendUp={true}
          />
          <KpiCard
            title="Active Alerts"
            value={kpis?.active_alerts ?? "—"}
            icon={<Radio className="h-5 w-5 text-pink-500" />}
            trend="Monitoring 6 channels"
            trendUp={null}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-xl h-72 flex items-center justify-center border border-border">
            <p className="text-muted-foreground text-sm font-medium">Journey Completion Funnel — coming soon</p>
          </div>
          <div className="bg-card p-6 rounded-xl h-72 flex items-center justify-center border border-border">
            <p className="text-muted-foreground text-sm font-medium">Cross-Channel Distribution — coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean | null;
}

function KpiCard({ title, value, icon, trend, trendUp }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card p-6 rounded-xl border border-border hover:border-border/80 transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-muted rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-foreground mb-2">{value}</div>
      <div
        className={`text-xs font-medium flex items-center gap-1 ${
          trendUp === true
            ? "text-destructive"
            : trendUp === false
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground"
        }`}
      >
        {trendUp !== null && (
          <ArrowUpRight className={`h-3 w-3 ${trendUp ? "" : "rotate-90"}`} />
        )}
        {trend}
      </div>
    </motion.div>
  );
}
