import Link from "next/link";
import { cn } from "@/lib/utils";
import { kanjiNum } from "@/lib/kanji";

type NavKey = "today" | "casual" | "ledger" | "stats" | "pro";

interface MastheadProps {
  active?: NavKey;
  streakDays?: number;
  initial?: string;
  /** Replace nav with a thin in-game header (game title + timer + solved count) */
  variant?: "default" | "game";
  gameTitle?: string;
  timer?: React.ReactNode;
  solvedCount?: { filled: number; total: number };
}

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "today", label: "Today", href: "/" },
  { key: "casual", label: "Casual", href: "/play/medium" },
  { key: "ledger", label: "Ledger", href: "/leaderboard" },
  { key: "stats", label: "Stats", href: "/stats" },
  { key: "pro", label: "Pro", href: "/pro" },
];

export function Masthead({
  active,
  streakDays = 21,
  initial = "·",
  variant = "default",
  gameTitle,
  timer,
  solvedCount,
}: MastheadProps) {
  if (variant === "game") {
    return (
      <header className="masthead">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="stamp">日</div>
            <div className="name">{gameTitle ?? "Daily"}</div>
          </Link>
        </div>
        <div className="flex items-center gap-6">
          {timer && (
            <div className="kdate-jp tnum text-2xl font-medium tracking-[0.04em] text-sumi font-mono">
              {timer}
            </div>
          )}
          {solvedCount && (
            <div className="flex items-center gap-2">
              <span className="eyebrow">solved</span>
              <span className="mincho text-lg font-semibold text-vermillion">
                {solvedCount.filled}
                <span className="text-moss text-[13px]">
                  /{solvedCount.total}
                </span>
              </span>
            </div>
          )}
          <div className="avatar">{initial.toUpperCase()}</div>
        </div>
      </header>
    );
  }

  return (
    <header className="masthead">
      <div className="flex items-center gap-7">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="stamp">箱</div>
          <div className="name">Hako</div>
        </Link>
        <nav className="hidden md:flex gap-[22px]">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(active === item.key && "on")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-[22px] text-[13px] text-moss">
        <div className="hidden sm:flex items-center gap-2">
          <span className="eyebrow">streak</span>
          <span className="mincho text-vermillion font-semibold text-lg">
            {kanjiNum(streakDays)}日
          </span>
        </div>
        <div className="avatar">{initial.toUpperCase()}</div>
      </div>
    </header>
  );
}
