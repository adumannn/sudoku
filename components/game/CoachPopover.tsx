"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/store/game-store";
import { Sparkles } from "lucide-react";

export function CoachPopover() {
  const board = useGame((s) => s.board);
  const selected = useGame((s) => s.selected);
  const givens = useGame((s) => s.givens);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const eligible =
    selected != null && givens[selected] === 0 && board[selected] === 0;

  const ask = async () => {
    if (!eligible) return;
    setBusy(true);
    setText("");
    setOpen(true);
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board, target: selected }),
    });
    if (!res.ok || !res.body) {
      setText((await res.text()) || "Error");
      setBusy(false);
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      setText((t) => t + dec.decode(value));
    }
    setBusy(false);
  };

  return (
    <div className="w-full max-w-md mt-3">
      <Button variant="outline" disabled={!eligible || busy} onClick={ask} className="w-full">
        <Sparkles className="h-4 w-4 mr-2" />
        {busy ? "Thinking…" : "Why this cell?"}
      </Button>
      {open && (
        <div className="mt-2 p-3 rounded-md border bg-muted/40 text-sm whitespace-pre-wrap min-h-[3rem]">
          {text || "…"}
        </div>
      )}
    </div>
  );
}
