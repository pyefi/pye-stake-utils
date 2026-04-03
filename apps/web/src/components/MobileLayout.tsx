"use client";

import { useUIStore } from "@/store/ui-provider";
import StakeAccountList from "./stake-list/StakeAccountList";
import ActionPanel from "./action-panel/ActionPanel";

export default function MobileLayout() {
  const selectedPubkey = useUIStore((s) => s.selectedAccountPubkey);

  return (
    <div className="h-[calc(100vh-180px)]">
      {selectedPubkey ? <ActionPanel /> : <StakeAccountList />}
    </div>
  );
}
