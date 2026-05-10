const STAMP_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function VermillionStamp({
  glyph,
  size,
  fontSize,
  rotate,
  className,
}: {
  glyph: string;
  size: number;
  fontSize: number;
  rotate?: number;
  className?: string;
}) {
  return (
    <div
      className={
        "relative inline-flex items-center justify-center bg-vermillion text-bone mincho font-bold leading-none " +
        (className ?? "")
      }
      style={{
        width: size,
        height: size,
        fontSize,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <span className="relative z-10">{glyph}</span>
      <span
        aria-hidden
        className="absolute inset-0 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: STAMP_NOISE }}
      />
    </div>
  );
}
