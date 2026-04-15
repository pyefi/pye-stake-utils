import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StakeSyncer from "@/components/StakeSyncer";
import StakeAccountList from "@/components/stake-list/StakeAccountList";
import ActionPanel from "@/components/action-panel/ActionPanel";
import MobileLayout from "@/components/MobileLayout";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-layers-base-primary overflow-hidden md:overflow-auto md:h-auto md:min-h-screen">
      <StakeSyncer />
      <Header />
      <main className="flex-1 min-h-0 flex flex-col items-center pt-4 pb-6 md:py-12 px-4">
        <div className="w-full max-w-[826px] flex flex-col gap-6 flex-1 min-h-0">
          <div className="flex flex-col gap-1">
            <h1
              className="text-[32px] text-text-primary font-light"
              style={{ fontFamily: "var(--font-garamond), serif" }}
            >
              Stake Manager
            </h1>
            <p className="text-sm text-text-secondary">
              View, split, and transfer your Solana stake accounts
            </p>
          </div>

          {/* Mobile: single-panel navigation */}
          <div className="md:hidden flex-1 min-h-0">
            <MobileLayout />
          </div>

          {/* Desktop: side-by-side */}
          <div className="hidden md:flex gap-4 min-h-[590px]">
            <div className="w-[380px] shrink-0">
              <StakeAccountList />
            </div>
            <div className="flex-1">
              <ActionPanel />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
