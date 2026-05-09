"use client";
import { useState, useTransition } from "react";
import { saveCity } from "@/app/actions/save-city";

interface Props {
  /** Current value stored on profile (lowercase-trim). */
  current: string | null;
  /** Vercel IP-geolocation hint for first-time pickers. */
  suggestion: string | null;
  /** Cities other solvers have used, sorted by descending solver count. */
  popular: { city: string; count: number }[];
  /** Compact form used in the home banner; default is the full inline form. */
  variant?: "default" | "banner";
}

export function CityPicker({ current, suggestion, popular, variant = "default" }: Props) {
  const [editing, setEditing] = useState(current === null);
  const [value, setValue] = useState<string>(current ?? suggestion ?? "");
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState(0);

  const submit = (next: string) => {
    start(async () => {
      const res = await saveCity({ city: next });
      if (res.ok) {
        setSavedAt(Date.now());
        setEditing(false);
      }
    });
  };

  if (!editing && current) {
    return (
      <div className="flex items-baseline gap-3">
        <div className="eyebrow">your city</div>
        <span className="kdate-jp text-[16px] text-sumi">{current}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mono text-[10px] tracking-[0.2em] uppercase text-moss hover:text-vermillion"
        >
          change
        </button>
      </div>
    );
  }

  return (
    <div className={variant === "banner" ? "border-y border-sumi/20 py-3 px-1" : ""}>
      <div className="eyebrow mb-2">
        {variant === "banner" ? "pick your city — show up on the right ledger" : "your city"}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={suggestion ?? "city"}
          className="border-[1.5px] border-sumi bg-bone px-3 py-1.5 font-jakarta text-[14px] text-sumi outline-none focus:bg-paper transition-colors max-w-[220px]"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => submit(value)}
          className="mono text-[10px] tracking-[0.2em] uppercase bg-sumi text-bone px-3 py-1.5 disabled:opacity-50"
        >
          {pending ? "…" : "save"}
        </button>
        {current !== null && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mono text-[10px] tracking-[0.2em] uppercase text-moss hover:text-sumi px-2 py-1.5"
          >
            cancel
          </button>
        )}
      </div>
      {popular.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {popular.slice(0, 8).map((c) => (
            <button
              key={c.city}
              type="button"
              onClick={() => {
                setValue(c.city);
                submit(c.city);
              }}
              className="mono text-[10px] tracking-[0.18em] uppercase text-moss hover:text-vermillion border border-sumi/15 px-2 py-1"
            >
              {c.city} · {c.count}
            </button>
          ))}
        </div>
      )}
      {savedAt > 0 && !pending && (
        <p className="ital text-moss text-[12px] mt-2">
          stored on your profile · changes from now on, past results keep their city.
        </p>
      )}
    </div>
  );
}
