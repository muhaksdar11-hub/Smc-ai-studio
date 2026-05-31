import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RefreshCcw, Wifi, ShieldAlert, Clock, AlertTriangle, Zap } from "lucide-react";
import { fetchApi } from "../lib/api";
import { Signal } from "../shared/types";
import { format } from "date-fns";

export function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [connStatus, setConnStatus] = useState<any>(null);
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const connRes = await fetchApi("/test_connection");
    if (connRes.success) setConnStatus(connRes.data);
    else setErrorMsg(connRes.message);

    const sigRes = await fetchApi("/latest-signal");
    if (sigRes.success && sigRes.data) {
      setLatestSignal(sigRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setErrorMsg(null);
    const res = await fetchApi("/scan", { method: "POST" });
    if (!res.success) {
       setErrorMsg(res.message);
    } else {
       if (res.data) setLatestSignal(res.data);
    }
    setScanning(false);
  };

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto pt-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">XAUUSD SYSTEM</h1>
          <p className="text-xs text-neutral-400 font-mono tracking-widest mt-1">SMART MONEY CONCEPTS AI</p>
        </div>
        <Button variant="ghost" size="icon" onClick={loadData} disabled={loading} className="text-neutral-400 hover:text-white">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-start space-x-3 text-red-500 text-sm">
           <AlertTriangle className="w-5 h-5 flex-shrink-0" />
           <span>{errorMsg}</span>
        </div>
      )}

      {/* SYSTEM STATUS */}
      <div className="grid grid-cols-2 gap-3">
        <StatusCard 
          title="Market Data" 
          value={connStatus?.market_data === "OK" ? "ONLINE" : "WAITING"} 
          icon={<Wifi className="w-4 h-4 opacity-50" />} 
          ok={connStatus?.market_data === "OK"} 
        />
        <StatusCard 
          title="Killzone" 
          value="ACTIVE" // Mock visually until we fetch real killzone status via endpoint
          icon={<Clock className="w-4 h-4 opacity-50" />} 
          ok={true} 
        />
        <StatusCard 
          title="AI Engine" 
          value={connStatus?.gemini === "CONFIGURED" ? "READY" : "OFFLINE"} 
          icon={<Zap className="w-4 h-4 opacity-50" />} 
          ok={connStatus?.gemini === "CONFIGURED"} 
        />
        <StatusCard 
          title="News Filter" 
          value={connStatus?.gnews === "CONFIGURED" ? "ACTIVE" : "OFFLINE"} 
          icon={<ShieldAlert className="w-4 h-4 opacity-50" />} 
          ok={connStatus?.gnews === "CONFIGURED"} 
        />
      </div>

      <Button 
        onClick={handleScan} 
        disabled={scanning}
        className="w-full h-14 text-sm font-semibold tracking-widest uppercase bg-emerald-500 hover:bg-emerald-600 text-neutral-950 transition-all rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
      >
        {scanning ? 'Analyzing Market...' : 'Run Manual Analysis'}
      </Button>

      {/* LATEST SIGNAL */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Latest Setup</h3>
        {latestSignal ? (
          <SignalCard signal={latestSignal} />
        ) : (
          <Card className="bg-neutral-900 border-neutral-800 p-6 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-neutral-600">No signals generated yet.</span>
            <span className="text-xs text-neutral-700">Waiting for perfect SMC conditions.</span>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusCard({ title, value, icon, ok }: { title: string, value: string, icon: React.ReactNode, ok: boolean }) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 p-4 flex flex-col space-y-2">
      <div className="flex justify-between items-center text-neutral-400">
        <span className="text-xs font-medium uppercase">{title}</span>
        {icon}
      </div>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-sm font-semibold text-white tracking-widest">{value}</span>
      </div>
    </Card>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const isBuy = signal.type === "BUY";
  return (
    <Card className="bg-neutral-900 border-neutral-800 overflow-hidden relative">
      <div className={`absolute top-0 left-0 w-1 h-full ${isBuy ? 'bg-blue-500' : 'bg-red-500'}`} />
      <div className="p-5 pl-6 space-y-4">
        <div className="flex justify-between items-start">
           <div>
             <div className="flex items-center space-x-2">
               <span className={`text-lg font-bold ${isBuy ? 'text-blue-400' : 'text-red-400'}`}>{signal.type}</span>
               <span className="text-lg font-bold text-white">{signal.symbol}</span>
             </div>
             <div className="text-xs text-neutral-500 font-mono mt-1">{signal.timestamp} • {signal.mode}</div>
           </div>
           
           <Badge variant="outline" className={`border-opacity-50 text-xs ${signal.ai_verdict === 'HIGH_QUALITY' ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-500'}`}>
             AI: {signal.ai_verdict}
           </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-neutral-950 p-4 rounded-lg font-mono text-sm border border-neutral-800">
          <div>
            <div className="text-neutral-500 text-xs mb-1">ENTRY</div>
            <div className="text-white font-semibold">{signal.entry.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs mb-1">STOP LOSS</div>
            <div className="text-red-400">{signal.sl.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs mb-1">TP 1</div>
            <div className="text-emerald-400">{signal.tp1.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs mb-1">TP 2</div>
            <div className="text-emerald-400">{signal.tp2.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
           <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500 uppercase tracking-widest">Confidence</span>
              <div className="h-1.5 w-16 bg-neutral-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500" style={{ width: `${signal.confidence}%` }} />
              </div>
              <span className="text-xs text-white">{signal.confidence}%</span>
           </div>
           
           <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
             FVG M: {((signal.fvg_high + signal.fvg_low)/2).toFixed(1)}
           </Badge>
        </div>
      </div>
    </Card>
  );
}
