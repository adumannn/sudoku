"use client";

import { useState, useTransition } from "react";
import { saveSfxPreference } from "@/app/actions/save-sfx-preference";
import { setSfxEnabled } from "@/lib/sfx";
import { cn } from "@/lib/utils";

interface SfxToggleProps {
  initialEnabled: boolean;
}

export function SfxToggle({ initialEnabled }: SfxToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const update = (next: boolean) => {
    const prev = enabled;
    setEnabled(next);
    setError(false);
    setSfxEnabled(next);

    startTransition(async () => {
      try {
        const result = await saveSfxPreference({ enabled: next });
        if (!result.ok) {
          setEnabled(prev);
          setSfxEnabled(prev);
          setError(true);
          return;
        }

        setEnabled(result.enabled);
        setSfxEnabled(result.enabled);
      } catch {
        setEnabled(prev);
        setSfxEnabled(prev);
        setError(true);
      }
    });
  };

  return (
    <div className="border-t border-sumi/18 pt-6">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div
            id="sfx-toggle-label"
            className="mono text-[10.5px] tracking-[0.22em] uppercase text-moss"
          >
            sound on solve and number-pad
          </div>
          <div className="ital text-[14px] text-moss mt-1">
            {enabled ? "enabled." : "silent."}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-labelledby="sfx-toggle-label"
          aria-checked={enabled}
          disabled={pending}
          onClick={() => update(!enabled)}
          className={cn(
            "inline-flex h-8 w-14 shrink-0 items-center border-[1.5px] border-sumi p-1 transition-colors disabled:opacity-60",
            enabled ? "justify-end bg-vermillion" : "justify-start bg-rice",
          )}
        >
          <span
            className={cn(
              "block h-5 w-5 bg-sumi transition-colors",
              enabled && "bg-bone",
            )}
          />
        </button>
      </div>
      {error && (
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-hazard mt-3">
          not stored
        </div>
      )}
    </div>
  );
}
