"use client";

import { motion } from "framer-motion";
import { ServerCrash, AlertTriangle, Cpu, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";

interface Incident {
  id: number;
  title: string;
  severity: "High" | "Medium" | "Low";
  affected_customers_count: number;
  business_impact: number;
  confidence_score: number;
  ai_root_cause: string;
  recommended_resolution: string;
  status: string;
  created_at: string;
}

const SEVERITY_STYLES = {
  High: {
    border: "border-l-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <ServerCrash className="h-5 w-5 text-destructive" />,
  },
  Medium: {
    border: "border-l-yellow-500",
    badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  },
  Low: {
    border: "border-l-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  },
};

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-destructive/10 text-destructive",
  Investigating: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/incidents")
      .then((r) => setIncidents(r.data))
      .catch((e) => console.error("Error fetching incidents:", e));
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await axios.put(`http://localhost:8000/api/incidents/${id}/status`, { status });
      setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, status } : inc)));
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const highCount = incidents.filter((i) => i.severity === "High").length;
  const medCount = incidents.filter((i) => i.severity === "Medium").length;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incident Center</h1>
            <p className="text-muted-foreground mt-1">
              AI-detected cross-channel journey anomalies and root causes.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {highCount} High
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm font-medium">
              {medCount} Medium
            </span>
          </div>
        </header>

        <div className="space-y-5">
          {incidents.map((incident, index) => {
            const sev = SEVERITY_STYLES[incident.severity] ?? SEVERITY_STYLES.Low;
            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`bg-card rounded-xl border border-border border-l-4 ${sev.border}`}
              >
                <div className="p-6">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {sev.icon}
                    <h2 className="text-base font-semibold text-foreground flex-1 min-w-0 truncate">
                      {incident.title}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${sev.badge}`}>
                      {incident.severity}
                    </span>
                    <select
                      value={incident.status}
                      onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full outline-none cursor-pointer ${
                        STATUS_STYLES[incident.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <Stat label="Affected Customers" value={incident.affected_customers_count.toLocaleString()} />
                    <Stat
                      label="Est. Business Impact"
                      value={`$${incident.business_impact.toLocaleString()}`}
                      valueClass="text-destructive"
                    />
                    <Stat
                      label="AI Confidence"
                      value={`${(incident.confidence_score * 100).toFixed(0)}%`}
                      valueClass="text-primary"
                    />
                    <Stat
                      label="Opened"
                      value={new Date(incident.created_at).toLocaleDateString()}
                    />
                  </div>

                  {/* Analysis panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wide mb-2">
                        <Cpu className="h-4 w-4" /> AI Root Cause
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{incident.ai_root_cause}</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wide mb-2">
                        <CheckCircle className="h-4 w-4" /> Recommended Resolution
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {incident.recommended_resolution}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {incidents.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">Loading incidents…</div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className={`font-semibold text-sm ${valueClass ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
