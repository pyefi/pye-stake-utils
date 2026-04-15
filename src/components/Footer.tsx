"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";

type RpcStatus = "connected" | "degraded" | "disconnected";

const STATUS_CONFIG: Record<RpcStatus, { color: string; label: string }> = {
  connected: { color: "bg-brand-action-green", label: "Stable Connection" },
  degraded: { color: "bg-brand-action-amber", label: "Slow Connection" },
  disconnected: { color: "bg-brand-action-red", label: "Disconnected" },
};

const PING_INTERVAL = 30_000;
const SLOW_THRESHOLD = 2_000;

function useRpcStatus(): RpcStatus {
  const { connection } = useConnection();
  const [status, setStatus] = useState<RpcStatus>("connected");

  useEffect(() => {
    let mounted = true;

    const ping = async () => {
      const start = Date.now();
      try {
        await connection.getVersion();
        if (!mounted) return;
        const elapsed = Date.now() - start;
        setStatus(elapsed > SLOW_THRESHOLD ? "degraded" : "connected");
      } catch {
        if (mounted) setStatus("disconnected");
      }
    };

    ping();
    const id = setInterval(ping, PING_INTERVAL);
    return () => { mounted = false; clearInterval(id); };
  }, [connection]);

  return status;
}

const monoStyle = {
  fontFeatureSettings:
    "'case' 1, 'zero' 1, 'cv01' 1, 'cv02' 1, 'cv03' 1, 'cv04' 1, 'lnum' 1, 'tnum' 1",
} as const;

export default function Footer() {
  const rpcStatus = useRpcStatus();
  const { color, label } = STATUS_CONFIG[rpcStatus];

  return (
    <footer className="flex items-center justify-between px-4 py-3 w-full">
      {/* Left: Version + Status */}
      <div className="flex items-end gap-4">
        <span
          className="text-xs font-normal uppercase text-text-secondary leading-[1.5]"
          style={monoStyle}
        >
          v0.1.0
        </span>

        <div className="flex items-center gap-2">
          <div className={`size-1.5 rounded-full ${color} shrink-0`} />
          <span
            className="hidden sm:inline text-xs font-normal uppercase text-text-secondary leading-[1.5]"
            style={monoStyle}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Right: Social Links */}
      <div className="flex items-center gap-2">
        <a
          href="https://discord.gg/pye"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discord"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M13.5447 2.57763C12.5249 2.07884 11.4313 1.71136 10.2879 1.50088C10.2671 1.49682 10.2463 1.50697 10.2356 1.52727C10.0949 1.79392 9.93916 2.14178 9.83008 2.41519C8.60026 2.21893 7.3768 2.21893 6.17218 2.41519C6.0631 2.1357 5.90164 1.79392 5.7604 1.52727C5.74966 1.50765 5.72884 1.4975 5.70802 1.50088C4.56526 1.71068 3.4717 2.07817 2.45129 2.57763C2.44245 2.58169 2.43488 2.58846 2.42985 2.59726C0.35559 5.90059-0.212633 9.12273 0.0661205 12.3049C0.0673805 12.3205 0.0755764 12.3354 0.0869284 12.3448C1.45547 13.4162 2.78114 14.0666 4.08218 14.4976C4.103 14.5044 4.12506 14.4963 4.13832 14.478C4.4461 14.03 4.72042 13.5576 4.95562 13.0609C4.96954 13.0318 4.95628 12.9972 4.9279 12.9857C4.49272 12.8098 4.07839 12.5953 3.67982 12.3516C3.64829 12.332 3.64576 12.2839 3.67477 12.2609C3.75864 12.1939 3.84254 12.1242 3.92263 12.0538C3.93712 12.0409 3.95731 12.0383 3.97435 12.0464C6.59284 13.3207 9.42766 13.3207 12.0153 12.0464C12.0323 12.0375 12.0525 12.0403 12.0677 12.0532C12.1478 12.1235 12.2316 12.1939 12.3161 12.2609C12.3452 12.2839 12.3432 12.332 12.3117 12.3516C11.9132 12.6 11.4988 12.8098 11.063 12.9851C11.0346 12.9966 11.022 13.0318 11.0359 13.0609C11.2761 13.5569 11.5505 14.0293 11.8526 14.4774C11.8652 14.4963 11.8879 14.5044 11.9087 14.4976C13.2161 14.0666 14.5418 13.4162 15.9103 12.3448C15.9222 12.3354 15.9299 12.3211 15.9311 12.3056C16.2647 8.62661 15.3723 5.43088 13.5654 2.59793C13.5611 2.58846 13.5535 2.58169 13.5447 2.57763ZM5.3467 10.3673C4.5583 10.3673 3.90875 9.59576 3.90875 8.64829C3.90875 7.70081 4.5457 6.92929 5.3467 6.92929C6.15388 6.92929 6.7972 7.70759 6.7846 8.64829C6.7846 9.59576 6.14758 10.3673 5.3467 10.3673ZM10.6632 10.3673C9.87484 10.3673 9.22528 9.59576 9.22528 8.64829C9.22528 7.70081 9.86218 6.92929 10.6632 6.92929C11.4704 6.92929 12.1137 7.70759 12.1011 8.64829C12.1011 9.59576 11.4704 10.3673 10.6632 10.3673Z"
              fill="currentColor"
            />
          </svg>
        </a>
        <a
          href="https://x.com/pyefi"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
            <path
              d="M12.5867 0H15.04L9.65333 5.94096L15.9467 14H11.008L7.14133 9.10258L2.71467 14H0.261333L5.968 7.64576L-0.0586667 0H5.00267L8.496 4.4738L12.5867 0ZM11.728 12.6052H13.088L4.288 1.34317H2.82667L11.728 12.6052Z"
              fill="currentColor"
            />
          </svg>
        </a>
      </div>
    </footer>
  );
}
