"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowUpRight, Ban, Users, DollarSign, Home, Compass, Radio } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

// Dashboard KPI Interface
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
    // Fetch from our FastAPI backend
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 glass hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link href="/" className="font-bold text-xl tracking-tighter text-primary flex items-center gap-2">
            <Compass className="h-5 w-5" />
            JourneyIQ
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg">
            <Home className="h-5 w-5" />
            Executive Dashboard
          </Link>
          <Link href="/customers" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Users className="h-5 w-5" />
            Customer 360
          </Link>
          <Link href="/timeline" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Activity className="h-5 w-5" />
            Journey Timeline
          </Link>
          <Link href="/incidents" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <AlertTriangle className="h-5 w-5" />
            Incidents
          </Link>
          <Link href="/alerts" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Radio className="h-5 w-5" />
            Live Alerts
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-gray-400 mt-1">Cross-channel customer journey performance overview.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Streaming Active
            </div>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <KpiCard 
            title="Critical Incidents" 
            value={kpis?.critical_incidents ?? "--"} 
            icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
            trend="+2 from yesterday"
            trendUp={true}
          />
          <KpiCard 
            title="Broken Journeys" 
            value={kpis?.broken_journeys ?? "--"} 
            icon={<Ban className="h-5 w-5 text-orange-400" />}
            trend="-14% vs last week"
            trendUp={false}
          />
          <KpiCard 
            title="Revenue Impact" 
            value={`$${kpis?.revenue_impact?.toLocaleString() ?? "--"}`} 
            icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
            trend="+$12k at risk"
            trendUp={true}
          />
          <KpiCard 
            title="CX Health Score" 
            value={kpis?.cx_health_score ?? "--"} 
            icon={<Activity className="h-5 w-5 text-blue-400" />}
            trend="Needs Improvement"
            trendUp={false}
          />
          <KpiCard 
            title="Customers at Risk" 
            value={kpis?.customers_at_risk ?? "--"} 
            icon={<Users className="h-5 w-5 text-purple-400" />}
            trend="Top 1% VIPs affected"
            trendUp={true}
          />
          <KpiCard 
            title="Active Alerts" 
            value={kpis?.active_alerts ?? "--"} 
            icon={<Radio className="h-5 w-5 text-pink-400" />}
            trend="Monitoring 6 channels"
            trendUp={null}
          />
        </div>

        {/* Placeholder for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-2xl h-80 flex items-center justify-center border border-white/5">
            <p className="text-gray-500">Journey Completion Funnel Chart</p>
          </div>
          <div className="glass p-6 rounded-2xl h-80 flex items-center justify-center border border-white/5">
            <p className="text-gray-500">Cross-Channel Distribution Chart</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ title, value, icon, trend, trendUp }: { title: string, value: any, icon: React.ReactNode, trend: string, trendUp: boolean | null }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className={`text-xs flex items-center gap-1 ${trendUp === true ? 'text-red-400' : trendUp === false ? 'text-emerald-400' : 'text-gray-500'}`}>
        {trendUp !== null && <ArrowUpRight className={`h-3 w-3 ${trendUp ? '' : 'rotate-90'}`} />}
        {trend}
      </div>
    </motion.div>
  );
}
