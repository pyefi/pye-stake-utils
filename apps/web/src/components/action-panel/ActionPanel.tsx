"use client";

import { motion } from "motion/react";
import { useUIStore } from "@/store/ui-provider";
import type { Tab } from "@/store/ui-store";
import StateChangeTab from "./StateChangeTab";
import SplitTab from "./SplitTab";
import TransferTab from "./TransferTab";

const tabs: { id: Tab; label: string }[] = [
  { id: "state-change", label: "State Change" },
  { id: "split", label: "Split" },
  { id: "transfer", label: "Transfer" },
];

export default function ActionPanel() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <div className="flex flex-col h-full bg-layers-surface-default rounded-[10px] overflow-hidden shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)] border-t border-layers-elevation-highlight">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-layers-elevation-shadow">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-2 text-sm transition-colors rounded-t ${
                active
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary-purple rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "state-change" && <StateChangeTab />}
        {activeTab === "split" && <SplitTab />}
        {activeTab === "transfer" && <TransferTab />}
      </div>
    </div>
  );
}
