"use client";
import { useState } from "react";
import { useGame } from "@/lib/store/game-store";

/**
 * Sensei panel — docked on the right rail under the numpad on desktop.
 * Renamed conceptually to match the Hako reference; export name preserved
 * so existing imports keep working.
 */
export function CoachPopover({ mode = "ask" }: { mode?: "ask" | "nudge" }) {
  const board = useGame((s) => s.board);
  const selected = useGame((s) => s.selected);
  const givens = useGame((s) => s.givens);
  const [text, setText] = useState<string>(
    "Look at the middle-right box. The 7 can only live in one place — R6C8. Place it, and column 8 collapses."
  );
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const eligible =
    selected != null && givens[selected] === 0 && board[selected] === 0;

  const ask = async (kind: "ask" | "nudge" = mode) => {
    if (busy) return;
    setBusy(true);
    setStreaming(true);
    setText("");
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, target: selected, kind }),
      });
      if (!res.ok || !res.body) {
        setText((await res.text()) || "Sensei is offline. Try again in a moment.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        setText((t) => t + dec.decode(value));
      }
    } catch (e) {
      setText("Sensei is offline. Try again in a moment.");
    } finally {
      setBusy(false);
      setStreaming(false);
    }
  };

  // Simple keyword underline of digits (e.g., "7") with vermillion accent.
  const renderText = (raw: string) => {
    const parts = raw.split(/(\b\d\b)/g);
    return parts.map((p, i) =>
      /^\d$/.test(p) ? (
        <strong key={i} className="text-vermillion">
          {p}
        </strong>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <div className="bg-sumi text-bone p-5 mt-6">
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex gap-2 items-center">
          <div className="w-6 h-6 bg-vermillion text-bone flex items-center justify-center mincho font-bold text-[13px]">
            先
          </div>
          <div className="mincho font-semibold text-[13px]">Sensei</div>
        </div>
        <div className="mono text-[9px] tracking-[0.2em] text-bone/65 uppercase">
          {streaming ? "streaming…" : "idle"}
        </div>
      </div>
      <p className="m-0 mincho text-[14px] leading-[1.55] min-h-[3.5rem]">
        {text ? renderText(text) : "—"}
      </p>
      <p className="mt-2 ital text-[13px] text-bone/65">
        Ask <em>nudge</em> instead and I won&rsquo;t say the answer.
      </p>

      <div className="grid grid-cols-2 gap-1.5 mt-3.5">
        <button
          type="button"
          disabled={busy || !eligible}
          onClick={() => ask("nudge")}
          className="py-2.5 border border-bone/65 bg-transparent text-bone mono text-[9.5px] tracking-[0.22em] uppercase disabled:opacity-50 hover:bg-bone/5"
        >
          nudge
        </button>
        <button
          type="button"
          disabled={busy || !eligible}
          onClick={() => ask("ask")}
          className="py-2.5 border-0 bg-vermillion text-bone mono text-[9.5px] tracking-[0.22em] uppercase disabled:opacity-50 hover:bg-vermillion-deep"
        >
          ask again
        </button>
      </div>
    </div>
  );
}
