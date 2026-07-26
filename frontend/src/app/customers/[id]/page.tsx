"use client";

import { motion } from "framer-motion";
import { Compass, Users, Activity, AlertTriangle, Radio, Home, ChevronLeft, Phone, Mail, Clock, BrainCircuit, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

export default function CustomerProfilePage() {
  const params = useParams();
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/customers/${params.id}`);
        setCustomer(response.data);
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    };
    if (params.id) fetchCustomer();
  }, [params.id]);

  if (!customer) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

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
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Home className="h-5 w-5" />
            Executive Dashboard
          </Link>
          <Link href="/customers" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
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
        <header className="mb-8">
          <Link href="/customers" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Customers
          </Link>
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                {customer.first_name[0]}{customer.last_name[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{customer.first_name} {customer.last_name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {customer.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {customer.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="glass px-4 py-2 rounded-xl text-center border-white/5">
                <div className="text-xs text-gray-400 mb-1">Health Score</div>
                <div className={`text-xl font-bold ${customer.health_score > 70 ? 'text-emerald-400' : customer.health_score > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(customer.health_score)}/100
                </div>
              </div>
              <div className="glass px-4 py-2 rounded-xl text-center border-white/5">
                <div className="text-xs text-gray-400 mb-1">Churn Risk</div>
                <div className="text-xl font-bold text-orange-400">
                  {(customer.churn_risk * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Summary */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-2xl border border-primary/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-2 mb-4 text-primary font-medium">
                <BrainCircuit className="h-5 w-5" />
                AI Journey Summary & Next Best Action
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                {customer.first_name} recently attempted to transfer funds via the Mobile App but encountered multiple errors. 
                They subsequently called the Call Center and waited in the IVR for an extended period. 
                This broken cross-channel experience has severely impacted their health score and increased churn risk.
              </p>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl inline-block text-sm">
                <strong className="text-primary block mb-1">Recommended Action:</strong>
                Proactively reach out with a personalized apology and offer a priority support line to resolve the transfer issue.
              </div>
            </motion.div>

            {/* Interaction History */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass p-6 rounded-2xl border border-white/5"
            >
              <h3 className="font-bold text-lg mb-6">Recent Cross-Channel Interactions</h3>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {customer.events && customer.events.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event: any, index: number) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 text-gray-400">
                      {event.status === 'Success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-4 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{event.event_type}</span>
                        <span className="text-xs text-gray-500 flex items-center"><Clock className="h-3 w-3 mr-1"/> {new Date(event.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-gray-400">Channel: {event.channel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar widgets */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass p-6 rounded-2xl border border-white/5">
              <h3 className="font-bold text-lg mb-4">Customer Details</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">ID</span> <span>#{customer.id}</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">Status</span> <span className="text-emerald-400">Active</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="text-gray-500">Member Since</span> <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
