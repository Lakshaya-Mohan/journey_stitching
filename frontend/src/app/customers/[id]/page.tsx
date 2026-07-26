"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, Clock, CheckCircle2, XCircle,
  AlertCircle, MapPin, ShieldAlert, Activity,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

interface JourneyEvent {
  id: number;
  channel: string;
  event_type: string;
  status: string;
  timestamp: string;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  health_score: number;
  churn_risk: number;
  created_at: string;
  events: JourneyEvent[];
}

export default function CustomerProfilePage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`http://localhost:8000/api/customers/${id}`)
      .then((r) => setCustomer(r.data))
      .catch((e) => console.error("Error fetching customer:", e));
  }, [id]);

  if (!customer) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading profile…
        </main>
      </div>
    );
  }

  const sortedEvents = [...customer.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Profile header */}
        <header className="bg-card border-b border-border px-8 pt-8 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-end pr-10 opacity-[0.04] pointer-events-none">
            <ShieldAlert className="w-72 h-72 text-foreground" />
          </div>

          <Link
            href="/customers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Customers
          </Link>

          <div className="flex flex-col md:flex-row md:items-end gap-6 relative z-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center text-primary font-bold text-2xl shadow">
              {customer.first_name[0]}{customer.last_name[0]}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {customer.first_name} {customer.last_name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {customer.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {customer.phone}
                </span>
              </div>
            </div>

            <div className="flex gap-3 shrink-0">
              <ScoreBadge
                label="Health Score"
                value={`${Math.round(customer.health_score)}`}
                color={
                  customer.health_score > 70
                    ? "text-emerald-600 dark:text-emerald-400"
                    : customer.health_score > 40
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-destructive"
                }
              />
              <ScoreBadge
                label="Churn Risk"
                value={`${(customer.churn_risk * 100).toFixed(0)}%`}
                color={customer.churn_risk > 0.5 ? "text-destructive" : "text-foreground"}
              />
              <Link
                href={`/timeline?customer=${customer.id}`}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-3 rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-colors min-w-[80px]"
              >
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Journey</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="xl:col-span-2 space-y-6">
            {customer.churn_risk > 0.4 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/5 border border-destructive/20 p-5 rounded-xl flex items-start gap-4"
              >
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive mb-1">High Churn Risk Detected</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI identifies a frustrated journey. Customer attempted a transfer on Mobile 3 times before calling
                    support. Recommended action: offer a fee waiver and dedicated support line.
                  </p>
                  <button className="mt-3 bg-destructive text-destructive-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">
                    Trigger Retention Playbook
                  </button>
                </div>
              </motion.div>
            )}

            {/* Cross-channel timeline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-card p-6 rounded-xl border border-border"
            >
              <h3 className="font-semibold text-base mb-6">Recent Cross-Channel Interactions</h3>

              {sortedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded.</p>
              ) : (
                <ol className="relative border-l border-border space-y-6 pl-6">
                  {sortedEvents.map((event) => (
                    <li key={event.id} className="relative">
                      <span
                        className={`absolute -left-[21px] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background ${
                          event.status === "Success"
                            ? "text-emerald-500"
                            : "text-destructive"
                        }`}
                      >
                        {event.status === "Success" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </span>
                      <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-medium text-sm text-foreground">{event.event_type}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.channel}
                          </span>
                          <span
                            className={`ml-3 font-medium ${
                              event.status === "Success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-card p-6 rounded-xl border border-border h-fit"
          >
            <h3 className="font-semibold text-base mb-4">Customer Details</h3>
            <dl className="space-y-3 text-sm">
              <DetailRow label="ID" value={`#${customer.id}`} />
              <DetailRow label="Status" value="Active" valueClass="text-emerald-600 dark:text-emerald-400" />
              <DetailRow
                label="Member Since"
                value={new Date(customer.created_at).toLocaleDateString()}
              />
              <DetailRow label="Total Events" value={`${customer.events.length}`} />
              <DetailRow
                label="Failed Events"
                value={`${customer.events.filter((e) => e.status === "Failed").length}`}
                valueClass={
                  customer.events.filter((e) => e.status === "Failed").length > 0
                    ? "text-destructive"
                    : undefined
                }
              />
            </dl>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function ScoreBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-background border border-border px-4 py-3 rounded-xl text-center min-w-[80px]">
      <div className="text-xs text-muted-foreground font-medium mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`font-medium text-right ${valueClass ?? "text-foreground"}`}>{value}</dd>
    </div>
  );
}
