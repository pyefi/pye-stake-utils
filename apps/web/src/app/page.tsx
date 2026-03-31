import Header from "@/components/Header";
import StakeSyncer from "@/components/StakeSyncer";
import StakeAccountList from "@/components/stake-list/StakeAccountList";
import ActionPanel from "@/components/action-panel/ActionPanel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-layers-base-primary">
      <StakeSyncer />
      <Header />
      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-[826px] flex flex-col gap-6">
          <h1
            className="text-[32px] text-text-primary font-light"
            style={{ fontFamily: "var(--font-garamond), serif" }}
          >
            Manage Stake
          </h1>

          <div className="flex gap-4 min-h-[590px]">
            {/* Left — account list */}
            <div className="w-[380px] shrink-0">
              <StakeAccountList />
            </div>

            {/* Right — action panel */}
            <div className="flex-1">
              <ActionPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
