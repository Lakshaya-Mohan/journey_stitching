"use client";

import { motion } from "framer-motion";
import { Compass, Users, Activity, Home, AlertTriangle, Radio, ServerCrash, Cpu, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/incidents");
        setIncidents(response.data);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      }
    };
    fetchIncidents();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 glass hidden md:flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link href="/" className="font-bold text-xl tracking-tighter text-primary flex items-center gap-2">
            <Compass className="h-5 w-5" />
            JourneyIQ
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
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
          <Link href="/incidents" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
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
            <h1 className="text-3xl font-bold tracking-tight">Journey Incident Center</h1>
            <p className="text-gray-400 mt-1">AI-detected cross-channel journey anomalies and root causes.</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              {incidents.filter(i => i.severity === 'High').length} High Severity
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
              {incidents.filter(i => i.severity === 'Medium').length} Medium
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {incidents.map((incident, index) => (
            <motion.div 
              key={incident.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass p-6 rounded-2xl border-l-4 ${incident.severity === 'High' ? 'border-l-red-500 border-white/5' : incident.severity === 'Medium' ? 'border-l-yellow-500 border-white/5' : 'border-l-emerald-500 border-white/5'}`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {incident.severity === 'High' ? <ServerCrash className="h-5 w-5 text-red-400" /> : <AlertTriangle className="h-5 w-5 text-yellow-400" />}
                    <h2 className="text-xl font-bold text-white">{incident.title}</h2>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${incident.status === 'Open' ? 'bg-red-500/20 text-red-400' : incident.status === 'Investigating' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {incident.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Affected Customers</p>
                      <p className="font-semibold">{incident.affected_customers_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Est. Business Impact</p>
                      <p className="font-semibold text-red-400">${incident.business_impact.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">AI Confidence</p>
                      <p className="font-semibold text-primary">{(incident.confidence_score * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created At</p>
                      <p className="font-semibold text-gray-300">{new Date(incident.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[400px] shrink-0 space-y-4">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                      <Cpu className="h-4 w-4" /> AI Root Cause Analysis
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{incident.ai_root_cause}</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                      <CheckCircle className="h-4 w-4" /> Recommended Resolution
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{incident.recommended_resolution}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
