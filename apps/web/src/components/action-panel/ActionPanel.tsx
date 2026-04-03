"use client";

import { ArrowLeft } from "lucide-react";
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
  const selectAccount = useUIStore((s) => s.selectAccount);

  return (
    <div className="flex flex-col h-full bg-layers-surface-default rounded-[6px] overflow-hidden shadow-[0px_4px_8px_0px_rgba(0,0,0,0.07)] border-t border-layers-elevation-highlight">
      {/* Module header with pill tabs */}
      <div className="relative flex items-center px-4 py-3 shrink-0 rounded-t-[6px]">
        <div className="absolute inset-0 pointer-events-none bg-layers-surface-default rounded-t-[6px]" />
        {/* Mobile back button */}
        <button
          onClick={() => selectAccount(null)}
          className="relative md:hidden flex items-center justify-center size-7 mr-3 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Back to accounts"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="relative flex items-start p-1 rounded-[4px] border-t border-layers-elevation-shadow">
          <div className="absolute inset-0 pointer-events-none bg-layers-surface-lowered-1 rounded-[4px]" />
          <div className="absolute inset-0 pointer-events-none rounded-[4px] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-highlight)]" />
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center px-3 py-1 ${
                  active ? "rounded-[2px]" : "rounded-[4px]"
                }`}
              >
                {active && (
                  <>
                    <div className="absolute inset-0 pointer-events-none bg-brand-primary-purple rounded-[2px] border-t border-brand-purple-8" />
                    <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--brand-purple-10)]" />
                  </>
                )}
                <span
                  className={`relative text-sm leading-[20px] whitespace-nowrap ${
                    active ? "text-white" : "text-text-secondary"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
      </div>

      {/* Tab content */}
      <div className="relative flex-1 min-h-0 overflow-y-auto p-4 flex flex-col border-t border-layers-elevation-highlight">
        <div className="absolute inset-0 pointer-events-none rounded-b-[6px] shadow-[inset_0px_-1px_0px_0px_var(--layers-elevation-shadow)]" />
        {activeTab === "state-change" && <StateChangeTab />}
        {activeTab === "split" && <SplitTab />}
        {activeTab === "transfer" && <TransferTab />}
      </div>
    </div>
  );
}
