"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Radio, ServerCrash, AlertTriangle, Bell, Info } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";

interface AlertBreakdown {
  trace_id: string;
  customer_segment: string;
  device_info: string;
  ip_address: string;
  raw_error_code: string;
  backend_service: string;
}

interface LiveAlert {
  id: number;
  channel: string;
  event_type: string;
  severity: "High" | "Medium" | "Low";
  message: string;
  timestamp: string;
  breakdown: AlertBreakdown;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/alerts");
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const alert: LiveAlert = JSON.parse(event.data);
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [alerts]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen">
        <header className="px-8 py-6 border-b border-border bg-background/80 backdrop-blur shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Live Journey Alerts</h1>
              <p className="text-muted-foreground mt-1">Real-time cross-channel anomaly stream.</p>
            </div>
            <div
              className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium ${
                isConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                }`}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-3">
            {alerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
                <Radio className="h-10 w-10 opacity-40" />
                <p className="text-sm">Waiting for incoming events…</p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {alerts.map((alert, i) => (
                <AlertCard key={`${alert.id}-${i}`} alert={alert} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AlertCard({ alert }: { alert: LiveAlert }) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    High: {
      border: "border-destructive/40",
      iconBg: "bg-destructive/10 text-destructive",
      icon: <ServerCrash className="h-5 w-5" />,
    },
    Medium: {
      border: "border-yellow-500/40",
      iconBg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    Low: {
      border: "border-primary/30",
      iconBg: "bg-primary/10 text-primary",
      icon: <Bell className="h-5 w-5" />,
    },
  };

  const cfg = severityConfig[alert.severity] ?? severityConfig.Low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`bg-card rounded-xl border ${cfg.border} cursor-pointer select-none`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex gap-3 p-4">
        <div className={`shrink-0 p-2 rounded-lg mt-0.5 ${cfg.iconBg}`}>{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 flex-wrap">
              {alert.event_type}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {alert.channel}
              </span>
            </h3>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{alert.message}</p>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-3">
                    <Info className="h-3.5 w-3.5" /> Technical Breakdown
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    <BreakdownRow label="Trace ID" value={alert.breakdown.trace_id} mono />
                    <BreakdownRow label="Segment" value={alert.breakdown.customer_segment} />
                    <BreakdownRow label="Device" value={alert.breakdown.device_info} />
                    <BreakdownRow label="IP Address" value={alert.breakdown.ip_address} mono />
                    <BreakdownRow
                      label="Error Code"
                      value={alert.breakdown.raw_error_code}
                      mono
                      valueClass="text-destructive"
                    />
                    <BreakdownRow
                      label="Backend Service"
                      value={alert.breakdown.backend_service}
                      mono
                      valueClass="text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function BreakdownRow({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-0.5">{label}</div>
      <div className={`${mono ? "font-mono" : "font-medium"} ${valueClass ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
