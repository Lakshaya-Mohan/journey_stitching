"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Compass, Users, Activity, Home, AlertTriangle, Radio, ServerCrash, Bell, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to FastAPI WebSocket
    const ws = new WebSocket("ws://localhost:8000/ws/alerts");
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts((prev) => [...prev, newAlert].slice(-50)); // Keep only last 50
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [alerts]);

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
          <Link href="/incidents" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <AlertTriangle className="h-5 w-5" />
            Incidents
          </Link>
          <Link href="/alerts" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
            <Radio className="h-5 w-5" />
            Live Alerts
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen">
        <header className="p-8 pb-4 shrink-0 border-b border-white/5 bg-background/50 backdrop-blur-xl z-10 relative">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Live Journey Alerts</h1>
              <p className="text-gray-400 mt-1">Real-time cross-channel anomaly streaming.</p>
            </div>
            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-medium ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isConnected ? 'Connected to Stream' : 'Disconnected'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {/* Decorative background radar */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5 opacity-50 pointer-events-none flex items-center justify-center">
            <div className="w-[400px] h-[400px] rounded-full border border-primary/10" />
            <div className="absolute w-[200px] h-[200px] rounded-full border border-primary/20" />
            <div className="absolute w-full h-[1px] bg-primary/10" />
            <div className="absolute h-full w-[1px] bg-primary/10" />
          </div>

          <div className="max-w-4xl mx-auto space-y-4 relative z-10 pb-20">
            {alerts.length === 0 && (
              <div className="text-center text-gray-500 mt-20 flex flex-col items-center">
                <Radio className="h-12 w-12 mb-4 opacity-50" />
                <p>Waiting for incoming events...</p>
              </div>
            )}
            
            <AnimatePresence>
              {alerts.map((alert, i) => (
                <AlertCard key={`${alert.id}-${i}`} alert={alert} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AlertCard({ alert }: { alert: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`glass p-4 rounded-xl border shadow-lg cursor-pointer transition-all hover:bg-white/5 ${
        alert.severity === 'High' ? 'border-red-500/30' : 
        alert.severity === 'Medium' ? 'border-yellow-500/30' : 
        'border-primary/30'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex gap-4">
        <div className={`mt-1 shrink-0 p-2 rounded-lg ${
          alert.severity === 'High' ? 'bg-red-500/10 text-red-400' : 
          alert.severity === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 
          'bg-primary/10 text-primary'
        }`}>
          {alert.severity === 'High' ? <ServerCrash className="h-5 w-5" /> : 
           alert.severity === 'Medium' ? <AlertTriangle className="h-5 w-5" /> : 
           <Bell className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-white flex items-center gap-2">
              {alert.event_type}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-normal">
                {alert.channel}
              </span>
            </h3>
            <span className="text-xs text-gray-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-400">{alert.message}</p>
          
          {expanded && alert.breakdown && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-white/10 text-sm"
            >
              <div className="flex items-center gap-2 text-primary font-semibold mb-3">
                <Info className="h-4 w-4" /> Technical Breakdown
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                <div>
                  <div className="text-gray-500 text-xs">Trace ID</div>
                  <div className="text-gray-300 font-mono text-xs mt-0.5">{alert.breakdown.trace_id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Customer Segment</div>
                  <div className="text-gray-300">{alert.breakdown.customer_segment}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Device Info</div>
                  <div className="text-gray-300">{alert.breakdown.device_info}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">IP Address</div>
                  <div className="text-gray-300 font-mono text-xs mt-0.5">{alert.breakdown.ip_address}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Raw Error Code</div>
                  <div className="text-red-400 font-mono text-xs mt-0.5">{alert.breakdown.raw_error_code}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">Backend Service</div>
                  <div className="text-emerald-400 font-mono text-xs mt-0.5">{alert.breakdown.backend_service}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
