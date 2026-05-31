import { useState, useEffect } from "react";
import { Activity, History, Settings, RefreshCcw } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { SignalsHistory } from "./components/SignalsHistory";
import { SettingsView } from "./components/SettingsView";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex flex-col h-[100dvh] bg-neutral-950 text-neutral-50 overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto no-scrollbar relative pb-20">
        <AnimatePresence mode="wait">
           {activeTab === "dashboard" && (
             <motion.div
               key="dashboard"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="min-h-full"
             >
               <Dashboard />
             </motion.div>
           )}
           {activeTab === "history" && (
             <motion.div
               key="history"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="min-h-full"
             >
               <SignalsHistory />
             </motion.div>
           )}
           {activeTab === "settings" && (
             <motion.div
               key="settings"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="min-h-full"
             >
               <SettingsView />
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-xl border-t border-neutral-800/50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto relative px-4">
          <NavItem 
            icon={<Activity />} 
            label="Home" 
            isActive={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
          />
          <NavItem 
            icon={<History />} 
            label="History" 
            isActive={activeTab === "history"} 
            onClick={() => setActiveTab("history")} 
          />
          <NavItem 
            icon={<Settings />} 
            label="Settings" 
            isActive={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
          />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
    >
      <div className={`p-1 rounded-full ${isActive ? 'bg-emerald-400/10' : ''}`}>
         {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
      {isActive && (
         <motion.div 
           layoutId="nav-indicator" 
           className="absolute bottom-0 w-8 h-[2px] bg-emerald-400 rounded-t-full"
         />
      )}
    </button>
  );
}
