"use client";

import { motion } from "framer-motion";
import { Compass, Users, Activity, AlertTriangle, Radio, Home, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/customers?limit=20");
        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
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
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Intelligence</h1>
            <p className="text-gray-400 mt-1">Search and view unified customer profiles.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </header>

        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Health Score</th>
                <th className="px-6 py-4">Churn Risk</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={customer.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {customer.first_name[0]}{customer.last_name[0]}
                    </div>
                    {customer.first_name} {customer.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{customer.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${customer.health_score > 70 ? 'bg-emerald-500' : customer.health_score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${customer.health_score}%` }} 
                        />
                      </div>
                      <span className={customer.health_score > 70 ? 'text-emerald-400' : customer.health_score > 40 ? 'text-yellow-400' : 'text-red-400'}>
                        {Math.round(customer.health_score)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{(customer.churn_risk * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/customers/${customer.id}`} className="inline-flex items-center text-primary hover:text-primary/80 transition-colors">
                      View 360 <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
