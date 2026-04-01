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
      <div className="flex items-start bg-layers-elevation-shadow gap-px shrink-0">
        {tabs.map((tab, i) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center h-[48px] px-4 border-t border-layers-elevation-highlight overflow-clip ${
                i === 0 ? "rounded-tl-[6px]" : ""
              } ${
                active
                  ? "bg-layers-surface-raised-1 text-text-primary"
                  : "bg-layers-surface-default text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="text-sm leading-[20px]">{tab.label}</span>
              <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
            </button>
          );
        })}
        {/* Trailing fill */}
        <div className="relative flex-1 h-[48px] bg-layers-surface-default border-t border-layers-elevation-highlight rounded-tr-[6px] overflow-clip">
          <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
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
