import { useState } from "react";
import { Settings, SlidersHorizontal, BellRing, Database } from "lucide-react";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { fetchApi } from "../lib/api";

export function SettingsView() {
  const [mode, setMode] = useState("SCALPING");

  const changeMode = async (val: string) => {
    setMode(val);
    await fetchApi("/switch_mode", { 
      method: "POST", 
      body: JSON.stringify({ mode: val })
    });
  };

  return (
    <div className="p-4 space-y-6 max-w-xl mx-auto pt-8">
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
      </div>

      <div className="space-y-4">
        
        <Card className="bg-neutral-900 border-neutral-800 p-5 space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">Trading Mode</h3>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Operation Mode</label>
            <Select value={mode} onValueChange={changeMode}>
              <SelectTrigger className="w-full bg-neutral-950 border-neutral-800 text-white h-12">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="SCALPING">SCALPING (M5 Execution)</SelectItem>
                <SelectItem value="INTRADAY">INTRADAY (M15 Execution)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-5 space-y-5">
           <div className="flex items-center space-x-3 mb-2">
            <BellRing className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">Notifications</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-medium">Telegram Alerts</div>
              <div className="text-xs text-neutral-500">Send signals to Telegram Bot</div>
            </div>
            <Switch checked={true} disabled />
          </div>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 p-5 space-y-5">
           <div className="flex items-center space-x-3 mb-2">
            <Database className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-300">Data Storage</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-medium">Cloud Sync (Firestore)</div>
              <div className="text-xs text-neutral-500">Persist signal history</div>
            </div>
            <Switch checked={true} disabled />
          </div>
        </Card>
        
      </div>
    </div>
  );
}
