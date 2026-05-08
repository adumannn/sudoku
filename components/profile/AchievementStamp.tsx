import { cn } from "@/lib/utils";

interface Props {
  glyph: string;
  earned?: boolean;
  size?: "tiny" | "small" | "large";
  title?: string;
}

const SIZE_CLS: Record<NonNullable<Props["size"]>, string> = {
  tiny: "w-8 h-8 text-base",
  small: "w-12 h-12 text-2xl",
  large: "w-24 h-24 text-[54px]",
};

export function AchievementStamp({
  glyph,
  earned = true,
  size = "tiny",
  title,
}: Props) {
  return (
    <div
      title={title}
      className={cn(
        "relative grid place-items-center mincho font-bold leading-none",
        SIZE_CLS[size],
        earned
          ? "bg-vermillion text-bone"
          : "bg-transparent text-sumi border-[1.5px] border-sumi/30",
      )}
    >
      <span className={cn(earned ? "" : "opacity-[0.18]")}>{glyph}</span>

      {earned && (
        <span
          aria-hidden
          className="absolute inset-0 mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      )}
      {earned && (
        <span
          aria-hidden
          className="absolute -top-[2px] -left-[2px] -right-[2px] -bottom-[2px] border-[1.5px] border-vermillion-deep mix-blend-multiply opacity-55 pointer-events-none"
          style={{ inset: "-2px 2px 2px -2px" }}
        />
      )}
      {!earned && (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 w-[84%] h-px bg-sumi/30 pointer-events-none"
          style={{ transform: "translate(-50%, -50%) rotate(-22deg)" }}
        />
      )}
    </div>
  );
}
