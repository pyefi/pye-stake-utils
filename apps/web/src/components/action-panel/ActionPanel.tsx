"use client";

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
    <div className="flex flex-col h-full bg-layers-surface-default rounded-[6px] overflow-hidden shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)] border-t border-layers-elevation-highlight">
      {/* Tab bar */}
      <div className="flex items-center px-4 h-[60px] shrink-0 border-b border-layers-elevation-shadow">
        <div className="flex gap-1 p-1 rounded-[4px] bg-layers-surface-lowered-1 border border-layers-elevation-shadow shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs rounded-[2px] transition-colors ${
                  active
                    ? "bg-brand-primary-purple text-white border-t border-brand-purple-8 shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-10)]"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col">
        {activeTab === "state-change" && <StateChangeTab />}
        {activeTab === "split" && <SplitTab />}
        {activeTab === "transfer" && <TransferTab />}
      </div>
    </div>
  );
}
