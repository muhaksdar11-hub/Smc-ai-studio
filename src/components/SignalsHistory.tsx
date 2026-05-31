import { useState, useEffect } from "react";
import { fetchApi } from "../lib/api";
import { Signal } from "../shared/types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { History, Target } from "lucide-react";

export function SignalsHistory() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetchApi("/signals?limit=20");
      if (res.success && res.data) {
         setSignals(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto pt-8">
      <div className="flex items-center space-x-3">
        <History className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Signal History</h1>
      </div>

      <div className="space-y-4 pb-10">
        {loading ? (
           <div className="text-neutral-500 text-center py-10 animate-pulse">Loading records...</div>
        ) : signals.length === 0 ? (
           <div className="text-neutral-500 text-center py-10">No signals found in database.</div>
        ) : (
           signals.map((sig, i) => <HistoryCard key={i} signal={sig} />)
        )}
      </div>
    </div>
  );
}

function HistoryCard({ signal }: { signal: Signal }) {
  const isBuy = signal.type === "BUY";
  
  return (
    <Card className="bg-neutral-900 border-neutral-800 p-4">
      <div className="flex justify-between items-start mb-3">
         <div>
           <div className="flex items-center space-x-2">
             <span className={`text-sm font-bold ${isBuy ? 'text-blue-400' : 'text-red-400'}`}>{signal.type}</span>
             <span className="text-sm font-bold text-white tracking-widest">{signal.symbol}</span>
           </div>
           <p className="text-[10px] text-neutral-500 font-mono mt-1">{signal.timestamp}</p>
         </div>
         <Badge variant="outline" className="border-neutral-700 text-neutral-400 text-[10px]">
           {signal.mode}
         </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 font-mono text-[10px] bg-neutral-950 p-2 rounded-lg">
        <div>
           <span className="text-neutral-600 block mb-1">ENTRY</span>
           <span className="text-white">{signal.entry.toFixed(2)}</span>
        </div>
        <div>
           <span className="text-neutral-600 block mb-1">SL</span>
           <span className="text-red-400">{signal.sl.toFixed(2)}</span>
        </div>
        <div>
           <span className="text-neutral-600 block mb-1">TP1</span>
           <span className="text-emerald-400">{signal.tp1.toFixed(2)}</span>
        </div>
        <div>
           <span className="text-neutral-600 block mb-1">TP2</span>
           <span className="text-emerald-400">{signal.tp2.toFixed(2)}</span>
        </div>
      </div>
      
      {signal.result && (
        <div className="mt-3 flex items-center justify-end space-x-2">
           <Target className="w-3 h-3 text-neutral-500" />
           <span className="text-xs text-neutral-400">Result: <span className="text-white font-medium">{signal.result}</span></span>
        </div>
      )}
    </Card>
  );
}
