"use client";

import { motion } from "framer-motion";
import { Compass, Users, Activity, Home, Filter, AlertTriangle, Radio } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node for Journey Events
function JourneyNode({ data }: any) {
  const isFailed = data.status === 'Failed';
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl border-2 bg-background min-w-[200px] ${isFailed ? 'border-red-500/50' : 'border-primary/50'}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-bold text-gray-400">{data.channel}</div>
        <div className={`text-[10px] px-2 py-0.5 rounded-full ${isFailed ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {data.status}
        </div>
      </div>
      <div className="font-semibold text-sm">{data.event_type}</div>
      <div className="text-xs text-gray-500 mt-2">{new Date(data.timestamp).toLocaleString()}</div>
      <Handle type="source" position={Position.Right} className="!bg-gray-500" />
    </div>
  );
}

const nodeTypes = {
  journey: JourneyNode,
};

export default function TimelinePage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventsForTimeline = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/events?limit=7");
        const events = response.data.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const newNodes = events.map((event: any, index: number) => ({
          id: `e${event.id}`,
          type: 'journey',
          position: { x: index * 300, y: 150 + (index % 2 === 0 ? 0 : 100) }, // Staggered horizontal layout
          data: event,
        }));

        const newEdges = [];
        for (let i = 0; i < events.length - 1; i++) {
          newEdges.push({
            id: `edge-${events[i].id}-${events[i+1].id}`,
            source: `e${events[i].id}`,
            target: `e${events[i+1].id}`,
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          });
        }

        setNodes(newNodes);
        setEdges(newEdges);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setLoading(false);
      }
    };
    fetchEventsForTimeline();
  }, [setNodes, setEdges]);

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
          <Link href="/customers" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Users className="h-5 w-5" />
            Customer 360
          </Link>
          <Link href="/timeline" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
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
      <main className="flex-1 flex flex-col h-screen">
        <header className="p-8 pb-4 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interactive Journey Timeline</h1>
            <p className="text-gray-400 mt-1">Visualize and analyze cross-channel customer pathways.</p>
          </div>
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
            <Filter className="h-4 w-4" /> Filter Journeys
          </button>
        </header>

        <div className="flex-1 relative m-8 mt-4 rounded-2xl overflow-hidden border border-white/10 glass shadow-2xl">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">Loading canvas...</div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              className="bg-black/20"
            >
              <Controls className="bg-background border-white/10 fill-white" />
              <MiniMap className="bg-background border-white/10" maskColor="rgba(0,0,0,0.5)" nodeColor="#3b82f6" />
              <Background color="#ffffff" gap={16} size={1} opacity={0.05} />
            </ReactFlow>
          )}
        </div>
      </main>
    </div>
  );
}
