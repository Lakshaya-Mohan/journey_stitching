"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronRight, X, AlertTriangle, CheckCircle2, XCircle,
  Clock, Smartphone, Globe, Phone, Building2, CreditCard, Landmark,
  BrainCircuit, TrendingUp, Lightbulb, ShieldAlert, Users, Activity,
  AlertCircle, Info,
} from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventMetadata {
  error_code?: string;
  error_message?: string;
  retry_count?: number;
  [key: string]: unknown;
}

interface StitchedEvent {
  id: number;
  channel: string;
  event_type: string;
  status: string;
  timestamp: string;
  device_id: string;
  metadata: EventMetadata;
  insight: string;
}

interface StageInsight {
  summary: string;
  root_cause: string | null;
  business_impact: string;
  confidence_score: number;
  recommendation: string;
}

interface Stage {
  name: string;
  status: "success" | "warning" | "failure";
  event_count: number;
  start_time: string;
  end_time: string;
  channels: string[];
  events: StitchedEvent[];
  insight: StageInsight;
}

interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  health_score: number;
  churn_risk: number;
}

interface StitchedJourney {
  goal: string;
  overall_status: string;
  duration_minutes: number;
  total_events: number;
  stages: Stage[];
  summary: string;
  customer: CustomerSummary;
}

interface CustomerListItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  health_score: number;
  churn_risk: number;
}

// ─── Channel icons ────────────────────────────────────────────────────────────

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  "Mobile App":       <Smartphone className="h-3.5 w-3.5" />,
  "Website":          <Globe className="h-3.5 w-3.5" />,
  "Call Center":      <Phone className="h-3.5 w-3.5" />,
  "Branch":           <Landmark className="h-3.5 w-3.5" />,
  "ATM":              <Building2 className="h-3.5 w-3.5" />,
  "Payment Gateway":  <CreditCard className="h-3.5 w-3.5" />,
};

const CHANNEL_COLOR: Record<string, string> = {
  "Mobile App":       "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Website":          "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Call Center":      "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "Branch":           "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "ATM":              "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "Payment Gateway":  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const STATUS_CONFIG = {
  success: {
    dot:    "bg-emerald-500",
    badge:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    border: "border-emerald-500/30",
    icon:   <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    label:  "Completed",
  },
  warning: {
    dot:    "bg-yellow-500",
    badge:  "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    border: "border-yellow-500/30",
    icon:   <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    label:  "With Friction",
  },
  failure: {
    dot:    "bg-destructive",
    badge:  "bg-destructive/10 text-destructive border-destructive/20",
    border: "border-destructive/30",
    icon:   <XCircle className="h-5 w-5 text-destructive" />,
    label:  "Failed",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <TimelineInner />
    </Suspense>
  );
}

function TimelineInner() {
  const searchParams = useSearchParams();
  const [customers, setCustomers]     = useState<CustomerListItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [journey, setJourney]         = useState<StitchedJourney | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [selectedStage, setSelectedStage]   = useState<Stage | null>(null);
  const [selectedEvent, setSelectedEvent]   = useState<StitchedEvent | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Load customer list on mount; auto-select from ?customer= query param
  useEffect(() => {
    axios.get("http://localhost:8000/api/customers?limit=100")
      .then(r => {
        setCustomers(r.data);
        const qid = searchParams.get("customer");
        if (qid) setSelectedId(Number(qid));
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch stitched journey when a customer is selected
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setJourney(null);
    setSelectedStage(null);
    setSelectedEvent(null);
    setExpandedStages(new Set());
    setError(null);
    axios.get(`http://localhost:8000/api/journey/${selectedId}/stitched`)
      .then(r => { setJourney(r.data); setLoading(false); })
      .catch(e => {
        console.error(e);
        setLoading(false);
        if (e.response?.status === 404) {
          setError("Journey data not found for this customer. Make sure the backend is running with the latest version.");
        } else {
          setError("Failed to load journey. Is the backend running at http://localhost:8000?");
        }
      });
  }, [selectedId]);

  const toggleStage = (name: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase();
    return `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
  });

  const handleStageClick = (stage: Stage) => {
    setSelectedStage(stage);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: StitchedEvent, stage: Stage, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedStage(stage);
  };

  const closePanel = () => { setSelectedStage(null); setSelectedEvent(null); };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />

      {/* Customer selector panel */}
      <aside className="w-72 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm mb-3">Select Customer</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search customers…"
              className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredCustomers.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-muted/50 ${
                selectedId === c.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {c.first_name[0]}{c.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-foreground truncate">
                    {c.first_name} {c.last_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  c.health_score > 70 ? "bg-emerald-500" :
                  c.health_score > 40 ? "bg-yellow-500" : "bg-destructive"
                }`} />
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Journey canvas */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* No customer selected */}
        {!selectedId && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <Activity className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">Select a customer to reconstruct their journey</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Stitching journey…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Could not load journey</p>
              <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
            </div>
            <div className="bg-muted rounded-lg px-4 py-3 text-xs text-muted-foreground font-mono text-left max-w-sm w-full">
              <p className="font-semibold text-foreground mb-1">To fix:</p>
              <p>1. Stop the current backend process</p>
              <p>2. Run: <span className="text-primary">uvicorn main:app --reload</span></p>
              <p>3. Select a customer again</p>
            </div>
            <button
              onClick={() => { setError(null); setSelectedId(null); }}
              className="text-sm text-primary hover:underline"
            >
              ← Choose a different customer
            </button>
          </div>
        )}

        {/* Journey loaded */}
        {journey && !loading && (
          <div className="flex flex-1 overflow-hidden">

            {/* Main scrollable timeline */}
            <div className="flex-1 overflow-auto">

              {/* Journey header */}
              <div className={`px-8 py-6 border-b border-border bg-card`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CONFIG[journey.overall_status as StatusKey]?.badge ?? STATUS_CONFIG.success.badge}`}>
                        {STATUS_CONFIG[journey.overall_status as StatusKey]?.label ?? journey.overall_status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {journey.duration_minutes} min · {journey.total_events} events · {journey.stages.length} stages
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-foreground">{journey.goal}</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">{journey.summary}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Customer</div>
                      <div className="font-semibold text-sm text-foreground">{journey.customer.name}</div>
                      <div className="text-xs text-muted-foreground">{journey.customer.email}</div>
                    </div>
                    <Link href={`/customers/${journey.customer.id}`}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <Users className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Journey progress bar */}
                <div className="mt-5 flex items-center gap-1">
                  {journey.stages.map((stage, i) => {
                    const cfg = STATUS_CONFIG[stage.status] ?? STATUS_CONFIG.success;
                    return (
                      <div key={stage.name} className="flex items-center gap-1 flex-1 min-w-0">
                        <button
                          onClick={() => handleStageClick(stage)}
                          className={`flex-1 h-2 rounded-full transition-all hover:opacity-80 ${cfg.dot}`}
                          title={stage.name}
                        />
                        {i < journey.stages.length - 1 && (
                          <div className="w-2 h-px bg-border shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1.5 flex gap-1">
                  {journey.stages.map(stage => (
                    <div key={stage.name} className="flex-1 min-w-0">
                      <span className="text-[10px] text-muted-foreground truncate block">{stage.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage list */}
              <div className="px-8 py-6 space-y-4">
                {journey.stages.map((stage, stageIndex) => {
                  const cfg = STATUS_CONFIG[stage.status] ?? STATUS_CONFIG.success;
                  const isExpanded = expandedStages.has(stage.name);
                  const isSelected = selectedStage?.name === stage.name && !selectedEvent;
                  return (
                    <motion.div
                      key={stage.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stageIndex * 0.06 }}
                    >
                      {/* Stage connector line */}
                      {stageIndex > 0 && (
                        <div className="flex justify-start pl-[22px] mb-4">
                          <div className="w-px h-4 bg-border" />
                        </div>
                      )}

                      <div
                        className={`rounded-xl border bg-card transition-all cursor-pointer
                          ${isSelected ? `border-2 ${cfg.border} shadow-sm` : "border-border hover:border-border/60"}`}
                        onClick={() => handleStageClick(stage)}
                      >
                        {/* Stage header */}
                        <div className="px-5 py-4 flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            stage.status === "success" ? "bg-emerald-500/10" :
                            stage.status === "warning" ? "bg-yellow-500/10" : "bg-destructive/10"
                          }`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm text-foreground">{stage.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                              {stage.channels.map(ch => (
                                <span key={ch} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLOR[ch] ?? "bg-muted text-muted-foreground"}`}>
                                  {CHANNEL_ICON[ch]}
                                  {ch}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(stage.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                {" — "}
                                {new Date(stage.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span>{stage.event_count} event{stage.event_count !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {(stage.insight.confidence_score * 100).toFixed(0)}% confidence
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); toggleStage(stage.name); }}
                              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded events */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border">
                                {stage.events.map((event, ei) => {
                                  const isEvSelected = selectedEvent?.id === event.id;
                                  return (
                                    <div
                                      key={event.id}
                                      onClick={e => handleEventClick(event, stage, e)}
                                      className={`flex items-start gap-4 px-5 py-3 border-b border-border last:border-0 cursor-pointer transition-colors
                                        ${isEvSelected ? "bg-primary/5" : "hover:bg-muted/40"}`}
                                    >
                                      {/* Event status dot + connector */}
                                      <div className="flex flex-col items-center shrink-0 mt-0.5">
                                        <div className={`w-2 h-2 rounded-full ${
                                          event.status === "Success" ? "bg-emerald-500" :
                                          event.status === "Failed"  ? "bg-destructive" : "bg-yellow-500"
                                        }`} />
                                        {ei < stage.events.length - 1 && (
                                          <div className="w-px flex-1 min-h-[16px] bg-border mt-1" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-medium text-sm text-foreground">{event.event_type}</span>
                                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${CHANNEL_COLOR[event.channel] ?? "bg-muted text-muted-foreground"}`}>
                                            {CHANNEL_ICON[event.channel]}
                                            {event.channel}
                                          </span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                            event.status === "Success"
                                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                              : "bg-destructive/10 text-destructive"
                                          }`}>
                                            {event.status}
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.insight}</p>
                                      </div>
                                      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* AI Insight panel */}
            <AnimatePresence>
              {selectedStage && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="shrink-0 border-l border-border bg-card overflow-hidden flex flex-col h-full"
                  style={{ minWidth: 0 }}
                >
                  <div className="w-[360px] flex flex-col h-full overflow-auto">
                    {/* Panel header */}
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">AI Insight</span>
                      </div>
                      <button onClick={closePanel} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-auto p-5 space-y-5">

                      {/* Showing event insight */}
                      {selectedEvent ? (
                        <>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Event</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{selectedEvent.event_type}</span>
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${CHANNEL_COLOR[selectedEvent.channel] ?? "bg-muted text-muted-foreground"}`}>
                                {CHANNEL_ICON[selectedEvent.channel]}
                                {selectedEvent.channel}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                selectedEvent.status === "Success"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-destructive/10 text-destructive"
                              }`}>{selectedEvent.status}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(selectedEvent.timestamp).toLocaleString()}
                            </div>
                          </div>

                          <InsightBox icon={<Info className="h-4 w-4" />} label="What happened" color="blue">
                            <p className="text-sm text-muted-foreground leading-relaxed">{selectedEvent.insight}</p>
                          </InsightBox>

                          {selectedEvent.metadata?.error_code && (
                            <InsightBox icon={<AlertCircle className="h-4 w-4" />} label="Error detail" color="red">
                              <div className="space-y-1.5 text-xs">
                                <div><span className="text-muted-foreground">Code: </span><span className="font-mono text-foreground">{selectedEvent.metadata.error_code}</span></div>
                                {selectedEvent.metadata.error_message && (
                                  <div><span className="text-muted-foreground">Message: </span><span className="text-foreground">{selectedEvent.metadata.error_message}</span></div>
                                )}
                                {selectedEvent.metadata.retry_count !== undefined && (
                                  <div><span className="text-muted-foreground">Retries: </span><span className="text-foreground">{selectedEvent.metadata.retry_count}</span></div>
                                )}
                              </div>
                            </InsightBox>
                          )}

                          <div className="pt-1">
                            <button
                              onClick={() => setSelectedEvent(null)}
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              ← View stage insights
                            </button>
                          </div>
                        </>
                      ) : (
                        /* Showing stage insight */
                        <>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Stage</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{selectedStage.name}</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[selectedStage.status]?.badge}`}>
                                {STATUS_CONFIG[selectedStage.status]?.label}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {selectedStage.event_count} events · {selectedStage.channels.join(", ")}
                            </div>
                          </div>

                          <InsightBox icon={<BrainCircuit className="h-4 w-4" />} label="AI Summary" color="blue">
                            <p className="text-sm text-muted-foreground leading-relaxed">{selectedStage.insight.summary}</p>
                          </InsightBox>

                          {selectedStage.insight.root_cause && (
                            <InsightBox icon={<ShieldAlert className="h-4 w-4" />} label="Root Cause" color="red">
                              <p className="text-sm text-muted-foreground leading-relaxed">{selectedStage.insight.root_cause}</p>
                            </InsightBox>
                          )}

                          <InsightBox icon={<TrendingUp className="h-4 w-4" />} label="Business Impact" color="orange">
                            <p className="text-sm text-muted-foreground leading-relaxed">{selectedStage.insight.business_impact}</p>
                          </InsightBox>

                          <InsightBox icon={<Lightbulb className="h-4 w-4" />} label="Recommended Action" color="green">
                            <p className="text-sm text-muted-foreground leading-relaxed">{selectedStage.insight.recommendation}</p>
                          </InsightBox>

                          {/* Confidence meter */}
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground font-medium">AI Confidence</span>
                              <span className="font-semibold text-foreground">{(selectedStage.insight.confidence_score * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  selectedStage.insight.confidence_score >= 0.9 ? "bg-emerald-500" :
                                  selectedStage.insight.confidence_score >= 0.75 ? "bg-yellow-500" : "bg-destructive"
                                }`}
                                style={{ width: `${selectedStage.insight.confidence_score * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Expand hint */}
                          {!expandedStages.has(selectedStage.name) && (
                            <button
                              onClick={() => toggleStage(selectedStage.name)}
                              className="w-full text-xs text-primary hover:underline flex items-center justify-center gap-1 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
                            >
                              Expand events in this stage <ChevronRight className="h-3 w-3 rotate-90" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

          </div>
        )}
      </main>
    </div>
  );
}

// ─── InsightBox helper ────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue:   { bg: "bg-blue-500/5",    border: "border-blue-500/15",   label: "text-blue-600 dark:text-blue-400" },
  red:    { bg: "bg-destructive/5", border: "border-destructive/15", label: "text-destructive" },
  orange: { bg: "bg-orange-500/5",  border: "border-orange-500/15", label: "text-orange-600 dark:text-orange-400" },
  green:  { bg: "bg-emerald-500/5", border: "border-emerald-500/15", label: "text-emerald-600 dark:text-emerald-400" },
} as const;

function InsightBox({
  icon,
  label,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  color: keyof typeof COLOR_MAP;
  children: React.ReactNode;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className={`rounded-lg border p-4 ${c.bg} ${c.border}`}>
      <div className={`flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wide mb-2 ${c.label}`}>
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
