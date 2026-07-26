"use client";

import { motion } from "framer-motion";
import { Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "@/components/Sidebar";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  health_score: number;
  churn_risk: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/customers?limit=100");
        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              {customers.length} customers · search and view unified profiles.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </header>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Health Score</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Churn Risk</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer, index) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {customer.first_name[0]}{customer.last_name[0]}
                      </div>
                      {customer.first_name} {customer.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{customer.email}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            customer.health_score > 70
                              ? "bg-emerald-500"
                              : customer.health_score > 40
                              ? "bg-yellow-500"
                              : "bg-destructive"
                          }`}
                          style={{ width: `${customer.health_score}%` }}
                        />
                      </div>
                      <span
                        className={`font-semibold tabular-nums ${
                          customer.health_score > 70
                            ? "text-emerald-600 dark:text-emerald-400"
                            : customer.health_score > 40
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-destructive"
                        }`}
                      >
                        {Math.round(customer.health_score)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`font-semibold tabular-nums ${
                        customer.churn_risk > 0.5 ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {(customer.churn_risk * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="inline-flex items-center gap-1 text-primary font-medium hover:underline text-sm"
                    >
                      View 360 <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No customers match &ldquo;{query}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
