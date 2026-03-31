import Header from "@/components/Header";
import StakeSyncer from "@/components/StakeSyncer";
import StakeAccountList from "@/components/stake-list/StakeAccountList";
import ActionPanel from "@/components/action-panel/ActionPanel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-layers-base-primary">
      <StakeSyncer />
      <Header />
      <main className="flex-1 flex flex-col px-4 py-6">
        <h1
          className="text-[32px] text-text-primary mb-6 font-light"
          style={{ fontFamily: "var(--font-garamond), serif" }}
        >
          Manage Stake
        </h1>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left — account list */}
          <div className="w-[420px] shrink-0 min-h-[500px]">
            <StakeAccountList />
          </div>

          {/* Right — action panel */}
          <div className="flex-1 min-h-[500px]">
            <ActionPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
